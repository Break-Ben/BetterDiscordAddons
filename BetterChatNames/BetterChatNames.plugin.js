/**
 * @name BetterChatNames
 * @author Break
 * @description Improves chat names by automatically capitalising them, and removing dashes & underscores
 * @version 1.5.6
 * @authorLink https://github.com/Break-Ben
 * @website https://github.com/Break-Ben/BetterDiscordAddons
 * @source https://github.com/Break-Ben/BetterDiscordAddons/tree/main/BetterChatNames
 * @updateUrl https://raw.githubusercontent.com/Break-Ben/BetterDiscordAddons/main/BetterChatNames/BetterChatNames.plugin.js
*/

const Capitalise = true
const RemoveDashes = true
// ↑ ↑ ↑ ↑ Settings ↑ ↑ ↑ ↑

var titleObserver
const DashRegex = new RegExp('-|_', 'g')
const CapitalRegex = new RegExp(/(?<=(^|[^\p{L}'’]))\p{L}/gu)
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
            const channel = data.props?.children?.props?.children?.[1]?.props?.children?.props?.children?.filter(c => c)[0]?.props?.children?.filter(c => c)[1]?.props
            if (channel) {
                channel.children = this.patchText(channel.children)
            }
        })

        // Toolbar Title
        Patcher.after(Title, 'default', (_, args, data) => {
            const titleBar = data?.props?.children?.props?.children
            const n = titleBar[1]?.props?.guild ? 0 : (titleBar[2]?.props?.guild ? 1 : null) //If in a server with 'Hide Channels' not installed
            if (n != null) {
                if (titleBar[n + 1].props.channel?.type == 11) { //If in a thread
                    titleBar[n].props.children.filter(c => c)[0].props.children[1].props.children = this.patchText(titleBar[n].props.children.filter(c => c)[0].props.children[1].props.children)
                }
                else { //If in chat/forum
                    const chatName = titleBar?.[n]?.props?.children?.[3]?.props?.children?.props
                    if (chatName) { // If channel not patched with EditChannels
                        chatName.children[2] = this.patchText(chatName.children[2])
                    }
                    else {
                        titleBar[n].props.children[3].props.children = this.patchText(titleBar[n].props.children[3].props.children)
                    }
                }
            }
        })

        // Chat placeholder
        Patcher.after(Placeholder, 'render', (_, args, data) => {
            const textarea = data?.props?.children?.[2]?.props
            if (textarea?.channel?.guild_id && textarea.channel.type != 11 && !textarea?.disabled && textarea?.type?.analyticsName == 'normal') {//If in a server, not in a thread, can message and not editing a message
                textarea.placeholder = this.patchText(textarea.placeholder)
            }
        })

        // Chat mention
        Patcher.after(Mention, 'default', (_, args, data) => {
            const mention = data?.props?.children?.[1].props?.children?.[0]?.props || data?.props?.children?.[1]?.props //If in chat or text area
            if (mention) {
                mention.children = this.patchText(mention.children)
            }
        })
    }

    // App title
    patchTitle() {
        const patchedTitle = this.patchText(document.title)
        if (CurrentServer?.getGuildId() && document.title != patchedTitle) { //If in server and title not already patched
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
        if (currentServer) { //If not in a DM
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