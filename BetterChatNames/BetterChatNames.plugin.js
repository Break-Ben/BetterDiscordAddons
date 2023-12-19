/**
 * @name BetterChatNames
 * @author Break
 * @description Improves chat names by automatically capitalising them, and removing dashes & underscores
 * @version 1.6.0
 * @authorLink https://github.com/Break-Ben
 * @website https://github.com/Break-Ben/BetterDiscordAddons
 * @source https://github.com/Break-Ben/BetterDiscordAddons/tree/main/BetterChatNames
 * @updateUrl https://raw.githubusercontent.com/Break-Ben/BetterDiscordAddons/main/BetterChatNames/BetterChatNames.plugin.js
 */

const Capitalise = true
const RemoveDashes = true
const PatchUnrestrictedChannels = true  // Also change the names of channels including threads, voice channels and stages that can already contain capitals and spaces
// ↑ ↑ ↑ ↑ Settings ↑ ↑ ↑ ↑

var titleObserver
const DashRegex = /-|_/g
const CapitalRegex = /(?<=(^|[^\p{L}'’]))\p{L}/gu
const { Webpack, Patcher } = new BdApi('BetterChatNames')
const { getByStrings, getByKeys, getByPrototypeKeys } = Webpack
const CurrentServer = getByKeys('getLastSelectedGuildId')
const CurrentChannel = getByKeys('getLastSelectedChannelId')
const TransitionTo = getByStrings('"transitionTo - Transitioning to "', { searchExports: true })

const Channels = getByStrings('.SELECTED', { defaultExport: false })
const Title = getByStrings('.HEADER_BAR', { defaultExport: false })
const Placeholder = getByPrototypeKeys('getPlaceholder').prototype
const Mention = getByStrings('.iconMention', { defaultExport: false })

module.exports = class BetterChatNames {
    patchNames() {
        // Chat names
        Patcher.after(Channels, 'default', (_, args, data) => {
            const channel = data.props?.children?.props?.children?.[1]?.props?.children?.props?.children?.find(c => c)?.props?.children?.filter(c => c)
            const channelName = channel?.[1]?.props

            if (channelName && (![2, 13].includes(channel?.[0]?.props?.channel?.type) || PatchUnrestrictedChannels)) { // If not a voice/stage channel or PatchUnrestrictedChannels is enabled
                channelName.children = this.patchText(channelName.children)
            }
        })

        // Toolbar Title
        Patcher.after(Title, 'default', (_, args, data) => {
            const titleBar = data?.props?.children?.props?.children?.filter(c => c)
            const n = titleBar[1]?.props?.guild ? 0 : titleBar[2]?.props?.guild ? 1 : null // If in a server with 'Hide Channels' installed

            if (n == null) { return }

            if (titleBar[n + 1].props.channel?.type == 11) { // If in a thread
                titleBar[n].props.children.find(c => c).props.children[1].props.children = this.patchText(titleBar[n].props.children.find(c => c).props.children[1].props.children)
                if (PatchUnrestrictedChannels) {
                    titleBar[n].props.children.filter(c => c)[2].props.children.props.children[2] = this.patchText(titleBar[n].props.children.filter(c => c)[2].props.children.props.children[2])
                }
            }
            else { // If in chat/forum
                const channelName = titleBar?.[n]?.props?.children?.[3]?.props?.children?.props
                if (channelName) { // If channel not patched with EditChannels
                    channelName.children[2] = this.patchText(channelName.children[2])
                }
                else {
                    titleBar[n].props.children[3].props.children = this.patchText(titleBar[n].props.children[3].props.children)
                }
            }
        })

        // Chat placeholder
        Patcher.after(Placeholder, 'render', (_, args, data) => {
            const textarea = data?.props?.children?.[2]?.props

            if (textarea?.channel?.guild_id && (textarea?.channel?.type != 11 || PatchUnrestrictedChannels) && !textarea?.disabled && textarea?.type?.analyticsName == 'normal') {// If in a server, not in a thread (or PatchUnrestrictedChannels is enabled), can message and not editing a message
                textarea.placeholder = this.patchText(textarea.placeholder)
            }
        })

        // Chat mention
        Patcher.after(Mention, 'default', (_, args, data) => {
            const channelName = data?.props?.children?.[1].props?.children?.[0]?.props || data?.props?.children?.[1]?.props // If in chat or text area

            if (channelName && (data.props.className.includes('iconMentionText') || PatchUnrestrictedChannels)) { // If a normal chat mention or PatchUnrestrictedChannels is enabled
                channelName.children = this.patchText(channelName.children)
            }
        })
    }

    // App title
    patchTitle() {
        const patchedTitle = this.patchText(document.title)

        if (CurrentServer?.getGuildId() && document.title != patchedTitle) { // If in server and title not already patched
            document.title = patchedTitle
        }
    }

    patchText(channelName) {
        if (RemoveDashes) { channelName = channelName.replace(DashRegex, ' ') }
        if (Capitalise) { channelName = channelName.replace(CapitalRegex, letter => letter.toUpperCase()) }
        return channelName
    }

    refreshChannel() {
        const currentServer = CurrentServer?.getGuildId()
        const currentChannel = CurrentChannel?.getChannelId()

        if (currentServer) { // If not in a DM
            TransitionTo('/channels/@me')
            setImmediate(() => TransitionTo(`/channels/${currentServer}/${currentChannel}`))
        }
    }

    start() {
        var lastUnpatchedAppTitle
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