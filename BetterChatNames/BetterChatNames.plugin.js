/**
 * @name BetterChatNames
 * @author Break
 * @description Improves chat names by automatically capitalising them and removing dashes/underscores
 * @version 1.6.1
 * @authorLink https://github.com/Break-Ben
 * @website https://github.com/Break-Ben/BetterDiscordAddons
 * @source https://github.com/Break-Ben/BetterDiscordAddons/tree/main/BetterChatNames
 * @updateUrl https://raw.githubusercontent.com/Break-Ben/BetterDiscordAddons/main/BetterChatNames/BetterChatNames.plugin.js
 */

const CAPITALISE = true
const REMOVE_DASHES = true
const PATCH_UNRESTRICTED_CHANNELS = true  // Also change the names of channels including threads, voice channels and stages that can already contain capitals and spaces
// ↑ ↑ ↑ ↑ Settings ↑ ↑ ↑ ↑

const VOICE = 2
const THREAD = 11
const STAGE = 13
const DASH_REGEX = /-|_/g
const CAPITAL_REGEX = /(?<=(^|[^\p{L}'’]))\p{L}/gu

var titleObserver
const { Webpack, Patcher } = new BdApi('BetterChatNames')
const { getByStrings, getByKeys, getByPrototypeKeys } = Webpack
const currentServer = getByKeys('getLastSelectedGuildId')
const currentChannel = getByKeys('getLastSelectedChannelId')
const transitionTo = getByStrings('"transitionTo - Transitioning to "', { searchExports: true })

const channels = getByStrings('.SELECTED', { defaultExport: false })
const title = getByStrings('.HEADER_BAR', { defaultExport: false })
const placeholder = getByPrototypeKeys('getPlaceholder').prototype
const mention = getByStrings('.iconMention', { defaultExport: false })

module.exports = class BetterChatNames {
    patchNames() {
        // Chat names
        Patcher.after(channels, 'Z', (_, args, data) => {
            const channel = data.props?.children?.props?.children?.[1]?.props?.children?.props?.children?.find(c => c)?.props?.children?.filter(c => c)
            const channelName = channel?.[1]?.props

            if (channelName && (![VOICE, STAGE].includes(channel?.[0]?.props?.channel?.type) || PATCH_UNRESTRICTED_CHANNELS)) { // If not a voice/stage channel or PATCH_UNRESTRICTED_CHANNELS is enabled
                channelName.children = this.patchText(channelName.children)
            }
        })

        // Toolbar Title
        Patcher.after(title, 'Z', (_, args, data) => {
            const titleBar = data?.props?.children?.props?.children?.filter(c => c)
            const n = titleBar[1]?.props?.guild ? 0 : titleBar[2]?.props?.guild ? 1 : null // If in a server with 'Hide Channels' installed
            if (n == null) { return }

            if (titleBar[n + 1].props.channel?.type == THREAD) { // If in a thread
                titleBar[n].props.children.find(c => c).props.children[1].props.children = this.patchText(titleBar[n].props.children.find(c => c).props.children[1].props.children)
                if (PATCH_UNRESTRICTED_CHANNELS) {
                    titleBar[n].props.children.filter(c => c)[2].props.children.props.children[2] = this.patchText(titleBar[n].props.children.filter(c => c)[2].props.children.props.children[2])
                }
            }
            else { // If in chat/forum
                const channelName = titleBar?.[n]?.props?.children?.[1]?.props?.children?.props?.children
                if (channelName) {
                    channelName[2] = this.patchText(channelName[2])
                }
            }
        })

        // Chat placeholder
        Patcher.after(placeholder, 'render', (_, args, data) => {
            const textarea = data?.props?.children?.[2]?.props

            if (textarea?.channel?.guild_id && (textarea?.channel?.type != THREAD || PATCH_UNRESTRICTED_CHANNELS) && !textarea?.disabled && textarea?.type?.analyticsName == 'normal') {// If in a server, not in a thread (or PATCH_UNRESTRICTED_CHANNELS is enabled), can message and not editing a message
                textarea.placeholder = this.patchText(textarea.placeholder)
            }
        })

        // Chat mention
        Patcher.after(mention, 'Z', (_, args, data) => {
            const channelName = data?.props?.children?.[1].props?.children?.[0]?.props || data?.props?.children?.[1]?.props // If in chat or text area

            if (channelName && (data.props.className.includes('iconMentionText') || PATCH_UNRESTRICTED_CHANNELS)) { // If a normal chat mention or PATCH_UNRESTRICTED_CHANNELS is enabled
                channelName.children = this.patchText(channelName.children)
            }
        })
    }

    // App title
    patchTitle() {
        const patchedTitle = this.patchText(document.title)

        if (currentServer?.getGuildId() && document.title != patchedTitle) { // If in server and title not already patched
            document.title = patchedTitle
        }
    }

    patchText(channelName) {
        if (REMOVE_DASHES) { channelName = channelName.replace(DASH_REGEX, ' ') }
        if (CAPITALISE) { channelName = channelName.replace(CAPITAL_REGEX, letter => letter.toUpperCase()) }
        return channelName
    }

    refreshChannel() {
        const currentServerId = currentServer?.getGuildId()
        const currentChannelId = currentChannel?.getChannelId()

        if (currentServerId) { // If not in a DM
            transitionTo('/channels/@me')
            setImmediate(() => transitionTo(`/channels/${currentServerId}/${currentChannelId}`))
        }
    }

    start() {
        let lastUnpatchedAppTitle
        titleObserver = new MutationObserver(_ => {
            if (document.title != lastUnpatchedAppTitle) { // Resolves conflicts with EditChannels' MutationObserver
                lastUnpatchedAppTitle = document.title
                this.patchTitle()
            }
        })

        titleObserver.observe(document.querySelector('title'), { childList: true })
        this.patchNames()
        this.refreshChannel()
    }

    stop() {
        titleObserver.disconnect()
        Patcher.unpatchAll()
        this.refreshChannel()
    }
}