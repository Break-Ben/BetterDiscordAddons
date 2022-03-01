/**
 * @name BetterChatNames
 * @author Break
 * @description Improves chat names by capitalising names and removing dashes and underlines
 * @version 1.0.0
 * @authorLink https://github.com/Ben-Break
 * @website https://github.com/Ben-Break
 * @source https://github.com/Ben-Break/BetterDiscordPlugins/tree/main/BetterChatNames
 * @updateUrl https://raw.githubusercontent.com/Ben-Break/BetterDiscordPlugins/main/BetterChatNames/BetterChatNames.plugin.js
 */

Patcher = BdApi.Patcher
const dashRegExp = new RegExp("-|_", "g")
const capitalRegExp = new RegExp(/(^\w{1})|(\W\w{1})/g)

module.exports = class BetterChatNames{
    start() {
        
        // Channel names
        Patcher.after("BetterChatNames", BdApi.findModule(m=>m?.default?.displayName === "ChannelItem"), "default", 
            (_, args, data)=>{
                if(data?.props?.children?.props?.children?.[1]?.props?.children?.[0]?.props?.children?.[1]?.props?.children?.[0]?.props?.children){
                    data.props.children.props.children[1].props.children[0].props.children[1].props.children[0].props.children = this.patchText(data.props.children.props.children[1].props.children[0].props.children[1].props.children[0].props.children)
                }
            }
        )

        // Title
        Patcher.after("BetterChatNames", BdApi.findModule(m=>m?.default?.displayName === "HeaderBar"), "default", 
            (_, args, data)=>{
                console.log(data)
                if(data?.props?.children?.props?.children?.[0]?.props?.children?.[1]?.props?.children?.[1]?.props?.children) {
                    data.props.children.props.children[0].props.children[1].props.children[1].props.children = this.patchText(data.props.children.props.children[0].props.children[1].props.children[1].props.children)
                }
                
            }
        )
        
        // Chat mention
        Patcher.after("BetterChatNames", BdApi.findModule(m=>m?.default?.displayName === "Mention"), "default", 
            (_, args, data)=>{
                if(data.props.children[0]?.props["aria-label"] == "Channel"){
                    data.props.children[1][0] = this.patchText(data.props.children[1][0])
                }
            }
        )

        // Placeholder text
        Patcher.after("BetterChatNames", BdApi.findModuleByDisplayName("SlateChannelTextArea").prototype, "render", 
            (_, args, data)=>{
                if(data?.props?.children?.[1]?.props?.children?.[0]){
                    data.props.children[1].props.children[0].props.children = this.patchText(data.props.children[1].props.children[0].props.children)
                }
            }
        )

        // Welcome to channel   TODO: Stop from capitalising every word
        Patcher.after("BetterChatNames", BdApi.findModule(m=>m?.default?.displayName === "TextChannelEmptyMessage"), "default", 
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

    patchText(channelName) 
    {
        channelName = channelName.replace(dashRegExp, " ") // Remove dash + underscore
        channelName = channelName.replace(capitalRegExp, letter => letter.toUpperCase()); // Capitalise    TODO: Welcome to channel text is all capitalised
        return channelName // Return name to be set in the function call
    }

    reloadGuild() {
        const currentGuildId = BdApi.findModuleByProps("getLastSelectedGuildId").getGuildId()
        const currentChannelId = BdApi.findModuleByProps("getLastSelectedChannelId").getChannelId()
        const transitionTo = BdApi.findModuleByProps("transitionTo").transitionTo
        //checks if ur not in dm
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