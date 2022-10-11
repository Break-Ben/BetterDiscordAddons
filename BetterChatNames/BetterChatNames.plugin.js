/**
 * @name BetterChatNames
 * @author Break
 * @description Improves chat names by automatically capitalising them, and removing dashes & underscores
 * @version 1.4.0
 * @authorLink https://github.com/Break-Ben
 * @website https://github.com/Break-Ben/BetterDiscordAddons
 * @source https://github.com/Break-Ben/BetterDiscordAddons/tree/main/BetterChatNames
 * @updateUrl https://raw.githubusercontent.com/Break-Ben/BetterDiscordAddons/main/BetterChatNames/BetterChatNames.plugin.js
*/

const Capitalise = true
const RemoveDashes = true
// ↑ ↑ ↑ ↑ Settings ↑ ↑ ↑ ↑

const DashRegex = new RegExp("-|_", "g")
const CapitalRegex = new RegExp(/(^\w)|([^a-zA-ZÀ-ɏḀ-ỿ'’]\w)/g)
const {Webpack, Patcher} = new BdApi("BetterChatNames")
const {getModule, Filters} = Webpack
const {byProps} = Filters
const TransitionTo = getModule(m => m.toString().includes('"transitionTo - Transitioning to "'), {searchExports: true})

const Channels = getModule(m => Object.values(m).some(v => v.toString().includes(".SELECTED")))
const Title = getModule(m => Object.values(m).some(v => v.toString().includes(".toolbar")))
const Mention = getModule(m => Object.values(m).some(v => v.toString().includes(".iconMention")))

module.exports = class BetterChatNames {
    patchNames() {
        // Chat names
        Patcher.after(Channels, "Z", 
            (_, args, data)=>{
                if(data?.props?.children?.props?.children?.[1]?.props?.children?.[0]?.props?.children?.[1]?.props?.children?.[0]?.props?.children){
                    data.props.children.props.children[1].props.children[0].props.children[1].props.children[0].props.children = this.patchText(data.props.children.props.children[1].props.children[0].props.children[1].props.children[0].props.children)
                }
            }
        )

        // Title
        Patcher.after(Title, "ZP", 
            (_, args, data)=>{
                const TitleBar = data?.props?.children?.props?.children?.[0]?.props?.children[1]
                if(TitleBar?.[1]?.props?.guild) {var n = 0} //If in a server
                else if(TitleBar?.[2]?.props?.guild) {var n = 1} //If in a server with 'Hide Channels' installed
                if(n != null) {
                    if(TitleBar[n+1].props.channel?.type == 11) { //If in a thread
                        data.props.children.props.children[0].props.children[1][n].props.children[0].props.children[1].props.children = this.patchText(TitleBar[n].props.children[0].props.children[1].props.children)
                    }
                    else { //If in chat/forum
                        data.props.children.props.children[0].props.children[1][n].props.children[1].props.children.props.children[2] = this.patchText(TitleBar[n].props.children[1].props.children.props.children[2])
                    }
                }
            }
        )

        // Chat mention
        Patcher.after(Mention, "Z", 
            (_, args, data)=>{
                if(data?.props?.children?.[0]){ //If a chat mention
                    if(data.props.role == "link") { //If in chat
                        data.props.children[1][0] = this.patchText(data.props.children[1][0])
                    }
                    else { //If in text area
                        data.props.children[1] = this.patchText(data.props.children[1])
                    }
                }
            }
        )

        this.reloadServer()
    }

    // App title
    patchTitle() {
        const patchedTitle = this.patchText(document.title)
        if(getModule(byProps("getLastSelectedGuildId")).getGuildId() && document.title != patchedTitle) { //If in server and title not already patched
            document.title = patchedTitle
        }
    }

    patchText(channelName) {
        if(RemoveDashes) {channelName = channelName.replace(DashRegex, " ")}
        if(Capitalise) {channelName = channelName.replace(CapitalRegex, letter => letter.toUpperCase())}
        return channelName
    }

    reloadServer() {
        const currentServer = getModule(byProps("getLastSelectedGuildId"))?.getGuildId()
        const currentChannel = getModule(byProps("getLastSelectedChannelId"))?.getChannelId()

        if(currentServer) { //If not in a DM
            TransitionTo(`/channels/@me`)
            setImmediate(()=>TransitionTo(`/channels/${currentServer}/${currentChannel}`))
        }
    }

    start() {
        new MutationObserver(_ => { this.patchTitle(); }).observe(document.querySelector('title'), {childList: true})
        this.patchNames()
    }

    stop() {
        Patcher.unpatchAll()
        this.reloadServer()
    }
}