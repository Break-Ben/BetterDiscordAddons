/**
 * @name BetterChatNames
 * @author Break
 * @description Improves chat names by automatically capitalising them and/or removing dashes/underscores
 * @version 1.7.0
 * @authorLink https://github.com/Break-Ben
 * @website https://github.com/Break-Ben/BetterDiscordAddons
 * @source https://github.com/Break-Ben/BetterDiscordAddons/tree/main/BetterChatNames
 * @updateUrl https://raw.githubusercontent.com/Break-Ben/BetterDiscordAddons/main/BetterChatNames/BetterChatNames.plugin.js
 */

const settings = {
    capitalise: true,
    removeDashes: true,
    removeEmojis: false,
    patchUnrestrictedChannels: true // Change the names of channels that can already contain capitals and spaces (e.g. voice channels, threads, and stages)
}   // ↑ ↑ ↑ ↑ Settings ↑ ↑ ↑ ↑

const unrestrictedChannels = {
    voice: 2,
    thread: 11,
    stage: 13
}
const regex = {
    dash: /-|_/g,
    capital: /(?<=(^|[^\p{L}'’]))\p{L}/gu,
    emoji: /-?\p{Emoji}-?/gu
}

let titleObserver
const { Webpack, Patcher, Utils } = new BdApi('BetterChatNames')
const { getModule, getByStrings, getByKeys, getByPrototypeKeys } = Webpack
const { findInTree } = Utils
const searchOptions = { walkable: ['children', 'props'] }

const currentServer = getByKeys('getLastSelectedGuildId')
const currentChannel = getByKeys('getLastSelectedChannelId')
const transitionTo = getByStrings('"transitionTo - Transitioning to "', { searchExports: true })

const sidebar = getModule(m => m?.render?.toString()?.includes('.CHANNEL'))
const title = getByStrings('.HEADER_BAR', { defaultExport: false })
const placeholder = getByPrototypeKeys('getPlaceholder').prototype
const mention = getByStrings('.iconMention', { defaultExport: false })

module.exports = class BetterChatNames {
    start() {
        this.observeAppTitle()
        this.patchNames()
        this.refreshChannel()
    }

    stop() {
        titleObserver.disconnect()
        Patcher.unpatchAll()
        this.refreshChannel()
    }

    observeAppTitle() {
        let lastUnpatchedAppTitle
        titleObserver = new MutationObserver(() => {
            if (document.title != lastUnpatchedAppTitle) { // Resolves conflicts with EditChannels' MutationObserver
                lastUnpatchedAppTitle = document.title
                this.patchAppTitle()
            }
        })
        titleObserver.observe(document.querySelector('title'), { childList: true })
    }

    patchAppTitle() {
        const patchedTitle = this.patchText(document.title)

        if (currentServer?.getGuildId() && document.title != patchedTitle) // If in server and title not already patched
            document.title = patchedTitle
    }

    patchNames() {
        this.patchSidebar()
        this.patchToolbarTitle()
        this.patchChatPlaceholder()
        this.patchMention()
    }

    patchSidebar() {
        Patcher.after(sidebar, 'render', (_, __, data) => {
            const channelName = findInTree(data, prop => typeof prop?.children == 'string', searchOptions)
            const channelType = findInTree(data, prop => prop?.channel, searchOptions).channel.type

            if (!Object.values(unrestrictedChannels).includes(channelType) || settings.patchUnrestrictedChannels) // If not a voice/stage channel or patchUnrestrictedChannels is enabled
                channelName.children = this.patchText(channelName.children)
        })
    }

    patchToolbarTitle() {
        Patcher.after(title, 'Z', (_, __, data) => {
            const rootChannel = findInTree(data, prop => prop?.level, searchOptions)
            if (!rootChannel)
                return

            if (rootChannel.level == 1) // If not in thread
                rootChannel.children.props.children[2] = this.patchText(rootChannel.children.props.children[2])
            else if (rootChannel.level == 2) { // If in thread
                rootChannel.children = this.patchText(rootChannel.children)
                if (settings.patchUnrestrictedChannels) {
                    const threadName = findInTree(data, prop => Array.isArray(prop) && prop[1] == ' ', searchOptions)
                    threadName[2] = this.patchText(threadName[2])
                }
            }
        })
    }

    patchChatPlaceholder() {
        Patcher.after(placeholder, 'render', (_, __, data) => {
            const textArea = findInTree(data, prop => prop.channel, searchOptions)

            if (textArea.channel.guild_id && (textArea.channel.type != unrestrictedChannels.thread || settings.patchUnrestrictedChannels) && !textArea.disabled && textArea.type.analyticsName == 'normal') // If in a server, not in a thread (or patchUnrestrictedChannels is enabled), can message and not editing a message
                textArea.placeholder = this.patchText(textArea.placeholder)
        })
    }

    patchMention() {
        Patcher.after(mention, 'Z', (_, __, data) => {
            const channelName = findInTree(data, prop => typeof prop.children == 'string', searchOptions)

            if (data.props.className.includes('iconMentionText') || settings.patchUnrestrictedChannels) // If is a normal chat mention (not a thread) or patchUnrestrictedChannels is enabled
                channelName.children = this.patchText(channelName.children)
        })
    }

    patchText(text) {
        if (settings.removeEmojis) text = text.replace(regex.emoji, '')
        if (settings.removeDashes) text = text.replace(regex.dash, ' ')
        if (settings.capitalise) text = text.replace(regex.capital, letter => letter.toUpperCase())
        return text
    }

    refreshChannel() {
        const currentServerId = currentServer?.getGuildId()
        const currentChannelId = currentChannel?.getChannelId()

        if (currentServerId) { // If not in a DM
            transitionTo('/channels/@me')
            setImmediate(() => transitionTo(`/channels/${currentServerId}/${currentChannelId}`))
        }
    }
}