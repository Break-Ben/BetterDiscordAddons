/**
 * @name BetterChatNames
 * @author Break
 * @description Improves chat names by capitalising names and removing dashes and underlines
 * @version 1.0.1
 * @authorLink https://github.com/Ben-Break
 * @website https://github.com/Ben-Break/BetterDiscordAddons
 * @source https://github.com/Ben-Break/BetterDiscordAddons/tree/main/BetterChatNames
 * @updateUrl https://raw.githubusercontent.com/Ben-Break/BetterDiscordAddons/main/BetterChatNames/BetterChatNames.plugin.js
 */

const Patcher = BdApi.Patcher
const dashRegExp = new RegExp("-|_", "g")
const capitalRegExp = new RegExp(/(^\w{1})|(\W\w{1})/g)
const Channels = BdApi.findModule(m=>m?.default?.displayName === "ChannelItem")
const Title = BdApi.findModule(m=>m?.default?.displayName === "HeaderBar")
const Mention = BdApi.findModule(m=>m?.default?.displayName === "Mention")
const Placeholder = BdApi.findModuleByDisplayName("SlateChannelTextArea").prototype
const Welcome = BdApi.findModule(m=>m?.default?.displayName === "TextChannelEmptyMessage")

module.exports = class BetterChatNames {
    start() {
        
        // Channel names
        Patcher.after("BetterChatNames", Channels, "default", 
            (_, args, data)=>{
                if(data?.props?.children?.props?.children?.[1]?.props?.children?.[0]?.props?.children?.[1]?.props?.children?.[0]?.props?.children){
                    data.props.children.props.children[1].props.children[0].props.children[1].props.children[0].props.children = this.patchText(data.props.children.props.children[1].props.children[0].props.children[1].props.children[0].props.children)
                }
            }
        )

        // Title
        Patcher.after("BetterChatNames", Title, "default", 
            (_, args, data)=>{
                if(data?.props?.children?.props?.children?.[0]?.props?.children?.[1]?.props?.children?.[1]?.props?.children) {
                    data.props.children.props.children[0].props.children[1].props.children[1].props.children = this.patchText(data.props.children.props.children[0].props.children[1].props.children[1].props.children)
                }
            }
        )
        
        // Chat mention
        Patcher.after("BetterChatNames", Mention, "default", 
            (_, args, data)=>{
                if(data.props.children[0]?.props["aria-label"] == "Channel"){
                    data.props.children[1][0] = this.patchText(data.props.children[1][0])
                }
            }
        )

        // Placeholder text
        Patcher.after("BetterChatNames", Placeholder, "render", 
            (_, args, data)=>{
                if(data?._owner?.key == "enabled"){
                    data.props.children[1].props.children[0].props.children = this.patchText(data.props.children[1].props.children[0].props.children)
                }
            }
        )

        // Welcome to channel message   TODO: Stop from capitalising every word
        Patcher.after("BetterChatNames", Welcome, "default", 
            (_, args, data)=>{
                if(data?.props?.children?.[2]?.props?.children?.[0]){
                    data.props.children[2].props.children[0] = this.patchText(data.props.children[2].props.children[0])
                }
                if(data?.props?.children?.[1]?.props?.children){
                    data.props.children[1].props.children = this.patchText(data.props.children[1].props.children)
                }
            }
        )

        this.reloadGuild()
    }

    patchText(channelName) { return channelName.replace(dashRegExp, " ").replace(capitalRegExp, letter => letter.toUpperCase()) } // Remove dash + underscore, then capitalise

    reloadGuild() {
        const currentGuildId = BdApi.findModuleByProps("getLastSelectedGuildId").getGuildId()
        const currentChannelId = BdApi.findModuleByProps("getLastSelectedChannelId").getChannelId()
        const transitionTo = BdApi.findModuleByProps("transitionTo").transitionTo

        // Checks if you're not in DM
        if(currentGuildId){
            transitionTo(`/channels/@me`)
            setImmediate(()=>transitionTo(`/channels/${currentGuildId}/${currentChannelId}`))
        }
    }

    stop() {
        Patcher.unpatchAll("BetterChatNames")
        this.reloadGuild()
    }
}