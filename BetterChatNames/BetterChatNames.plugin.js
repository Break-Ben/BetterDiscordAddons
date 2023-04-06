/**
 * @name BetterChatNames
 * @author Break
 * @description Improves chat names by automatically capitalising them, and removing dashes & underscores
 * @version 1.4.7
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
const CapitalRegex = new RegExp(/(^\w)|([^a-zA-ZÀ-ɏḀ-ỿ'’]\w)/g)
const { Webpack, Patcher } = new BdApi('BetterChatNames')
const { getModule, Filters } = Webpack
const { byProps, byStrings } = Filters
const CurrentServer = getModule(byProps('getLastSelectedGuildId'))
const CurrentChannel = getModule(byProps('getLastSelectedChannelId'))
const TransitionTo = getModule(byStrings('"transitionTo - Transitioning to "'), { searchExports: true })

const Channels = getModule(m => Object.values(m).some(byStrings('.SELECTED')))
const Title = getModule(m => Object.values(m).some(byStrings('.toolbar')))
const Placeholder = getModule(m => m.type?.render && byStrings('.richValue,', ',submitButtonVisible:(null===(')(m.type?.render))?.type
const Mention = getModule(m => Object.values(m).some(byStrings('.iconMention')))

module.exports = class BetterChatNames {
    patchNames() {
        // Chat names
        Patcher.after(Channels, 'Z',
            (_, args, data) => {
                if (data.props?.children?.props?.children?.[1]?.props?.children?.filter(c => c)[0]?.props?.children?.filter(c => c)[1]?.props?.children?.[0]) {
                    data.props.children.props.children[1].props.children.filter(c => c)[0].props.children.filter(c => c)[1].props.children[0] = this.patchText(data.props.children.props.children[1].props.children.filter(c => c)[0].props.children.filter(c => c)[1].props.children[0])
                }
            }
        )

        // Title
        Patcher.after(Title, 'ZP',
            (_, args, data) => {
                const titleBar = data?.props?.children?.props?.children?.[0]?.props?.children[1]
                if (titleBar?.[1]?.props?.guild) { var n = 0 } //If in a server
                else if (titleBar?.[2]?.props?.guild) { var n = 1 } //If in a server with 'Hide Channels' installed
                if (n != null) {
                    if (titleBar[n + 1].props.channel?.type == 11) { //If in a thread
                        data.props.children.props.children[0].props.children[1][n].props.children.filter(c => c)[0].props.children[1].props.children = this.patchText(titleBar[n].props.children.filter(c => c)[0].props.children[1].props.children)
                    }
                    else { //If in chat/forum
                        data.props.children.props.children[0].props.children[1][n].props.children.filter(c => c)[1].props.children.props.children[2] = this.patchText(titleBar[n].props.children.filter(c => c)[1].props.children.props.children[2])
                    }
                }
            }
        )

        // Chat placeholder
        Patcher.after(Placeholder, 'render',
            (_, args, data) => {
                if (data?.props?.children?.props?.children?.[1]?.props?.children?.[0]?.props?.channel?.guild_id && !data?.props?.children?.props?.children?.[0]?.props?.editorRef?.current?.props?.disabled) {//If in a server and can message
                    data.props.children.props.children[1].props.children[1].props.children[2].props.children[1].props.children.props.placeholder = this.patchText(data.props.children.props.children[1].props.children[1].props.children[2].props.children[1].props.children.props.placeholder)
                }
            }
        )

        // Chat mention
        Patcher.after(Mention, 'Z',
            (_, args, data) => {
                if (data?.props?.children?.[1]) {
                    data.props.children[1].props.children[0] = this.patchText(data.props.children[1].props.children[0])
                }
            }
        )
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

    reloadServer() {
        const currentServer = CurrentServer?.getGuildId()
        const currentChannel = CurrentChannel?.getChannelId()
        if (currentServer) { //If not in a DM
            TransitionTo('/channels/@me')
            setImmediate(() => TransitionTo(`/channels/${currentServer}/${currentChannel}`))
        }
    }

    start() {
        titleObserver = new MutationObserver(_ => { this.patchTitle(); })
        titleObserver.observe(document.querySelector('title'), { childList: true })
        this.patchNames()
        this.reloadServer()
    }

    stop() {
        titleObserver.disconnect()
        Patcher.unpatchAll()
        this.reloadServer()
    }
}