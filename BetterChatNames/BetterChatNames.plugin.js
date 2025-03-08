/**
 * @name BetterChatNames
 * @author Break
 * @description Improves chat names by automatically capitalising them and removing dashes/underscores
 * @version 1.6.4
 * @authorLink https://github.com/Break-Ben
 * @website https://github.com/Break-Ben/BetterDiscordAddons
 * @source https://github.com/Break-Ben/BetterDiscordAddons/tree/main/BetterChatNames
 * @updateUrl https://raw.githubusercontent.com/Break-Ben/BetterDiscordAddons/main/BetterChatNames/BetterChatNames.plugin.js
 */

const settings = {
    capitalise: true,
    removeDashes: true,
    removeEmojis: false,
    patchUnrestrictedChannels: true // Also change the names of channels including threads, voice channels and stages that can already contain capitals and spaces
}   // ↑ ↑ ↑ ↑ Settings ↑ ↑ ↑ ↑

const channelTypes = {
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
const { Webpack, Patcher } = new BdApi('BetterChatNames')
const { getByStrings, getByKeys, getByPrototypeKeys } = Webpack
const currentServer = getByKeys('getLastSelectedGuildId')
const currentChannel = getByKeys('getLastSelectedChannelId')
const transitionTo = getByStrings('"transitionTo - Transitioning to "', { searchExports: true })

const sidebar = getByStrings('.SELECTED', { defaultExport: false })
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
        Patcher.after(sidebar, 'ZP', (_, args, data) => {
            const channel = data?.props?.children
            const channelInfo = channel?.children // If BetterChannelList is installed
                ? channel?.children?.props?.children?.[1]?.props?.children?.props?.children
                : channel?.props?.children?.[1]?.props?.children?.props?.children?.[0]?.props?.children?.filter(Boolean)
            const channelName = channelInfo?.[1]?.props?.children?.[0]?.props?.children?.[1]?.props?.children?.[0]?.props ?? channelInfo?.[1]?.props

            if (channelName && (![channelTypes.voice, channelTypes.stage].includes(channelInfo?.[0]?.props?.channel?.type) || settings.patchUnrestrictedChannels)) // If not a voice/stage channel or patchUnrestrictedChannels is enabled
                channelName.children = this.patchText(channelName.children)
        })
    }

    patchToolbarTitle() {
        Patcher.after(title, 'Z', (_, args, data) => {
            const titleBar = data?.props?.children?.props?.children?.filter(Boolean)
            const n = titleBar[1]?.props?.guild ? 0 : titleBar[2]?.props?.guild ? 1 : null // If in a server with 'Hide Channels' installed
            if (n == null) return

            if (titleBar[n + 1].props.channel?.type == channelTypes.thread) { // If in a thread
                titleBar[n].props.children.find(Boolean).props.children[1].props.children = this.patchText(titleBar[n].props.children.find(Boolean).props.children[1].props.children)
                if (settings.patchUnrestrictedChannels)
                    titleBar[n].props.children.filter(Boolean)[2].props.children.props.children[2] = this.patchText(titleBar[n].props.children.filter(Boolean)[2].props.children.props.children[2])
            }
            else { // If in chat/forum
                const channelName = titleBar?.[n]?.props?.children?.[1]?.props?.children?.props?.children
                if (channelName)
                    channelName[2] = this.patchText(channelName[2])
            }
        })
    }

    patchChatPlaceholder() {
        Patcher.after(placeholder, 'render', (_, args, data) => {
            const textArea = data?.props?.children?.[2]?.props

            if (textArea?.channel?.guild_id && (textArea?.channel?.type != channelTypes.thread || settings.patchUnrestrictedChannels) && !textArea?.disabled && textArea?.type?.analyticsName == 'normal')// If in a server, not in a thread (or patchUnrestrictedChannels is enabled), can message and not editing a message
                textArea.placeholder = this.patchText(textArea.placeholder)
        })
    }

    patchMention() {
        Patcher.after(mention, 'Z', (_, args, data) => {
            const channelName = data?.props?.children?.[1].props?.children?.[0]?.props || data?.props?.children?.[1]?.props // If in chat or text area

            if (typeof channelName.children != "object" && (data.props.className.includes('iconMentionText') || settings.patchUnrestrictedChannels)) // If channel is known and is a normal chat mention or patchUnrestrictedChannels is enabled
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