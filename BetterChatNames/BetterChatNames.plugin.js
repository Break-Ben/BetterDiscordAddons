/**
 * @name BetterChatNames
 * @author Break
 * @description Improves chat names by capitalising them, and removing dashes/underlines
 * @version 1.1.0
 * @authorLink https://github.com/Ben-Break
 * @website https://github.com/Ben-Break/BetterDiscordAddons
 * @source https://github.com/Ben-Break/BetterDiscordAddons/tree/main/BetterChatNames
 * @updateUrl https://raw.githubusercontent.com/Ben-Break/BetterDiscordAddons/main/BetterChatNames/BetterChatNames.plugin.js
 */

const Patcher = BdApi.Patcher
const DashRegex = new RegExp("-|_", "g")
const CapitalRegex = new RegExp(/(^\w{1})|(\W\w{1})/g)
const Channels = BdApi.findModule(m=>m?.default?.displayName === "ChannelItem")
const Title = BdApi.findModule(m=>m?.default?.displayName === "HeaderBar")
const Mention = BdApi.findModule(m=>m?.default?.displayName === "Mention")
const Placeholder = BdApi.findModuleByDisplayName("SlateChannelTextArea").prototype
const Dropdown = BdApi.findModuleByProps("SingleSelect")
const Welcome = BdApi.findModule(m=>m?.default?.displayName === "TextChannelEmptyMessage")
const MentionAutocomplete = BdApi.findModule(m=>m.default.displayName === "Autocomplete")
const Search = BdApi.findModuleByProps("SearchPopoutComponent")
const QuickSwitcher = BdApi.findModule(m=>m.Channel.displayName === "Channel")

const PatchAutocomplete = true
/*                         ↑↑ 
Toggles changing the names of mention & search autocomplete (because you still need to type the dashes/underscores)
*/
module.exports = class BetterChatNames {
    start() {
        
        // Chat names
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

        // Message placeholder
        Patcher.after("BetterChatNames", Placeholder, "render", 
            (_, args, data)=>{
                if(data?.props?.children?.[1]?.props?.children?.[0] && data?._owner?.key == "enabled"){
                    data.props.children[1].props.children[0].props.children = this.patchText(data.props.children[1].props.children[0].props.children)
                }
            }
        )

        // Dropdown (in server settings)
        Patcher.after("BetterChatNames", Dropdown, "SingleSelect",
            (_, args, data)=>{
                if(data?.props?.options?.[1]?.channel?.type == 0 || data?.props?.options?.[0]?.label?.startsWith("#")) {
                    data.props.options.forEach(element => {
                        element.label = this.patchText(element.label)
                    });
                }
            }
        )

        // 'Welcome to channel'
        Patcher.after("BetterChatNames", Welcome, "default", 
            (_, args, data)=>{
                if(data?.props?.children?.[1]?.props?.children){
                    var str = data.props.children[1].props.children
                    data.props.children[1].props.children = str.substring(0, str.indexOf("#")) + this.patchText(str.substring(str.indexOf("#")))
                }
                if(data?.props?.children?.[2]?.props?.children?.[0]){
                    var str = data.props.children[2].props.children[0]
                    data.props.children[2].props.children[0] = str.substring(0, str.indexOf("#")) + this.patchText(str.substring(str.indexOf("#")))
                }
            }
        )

        if(PatchAutocomplete) {

        // Mention Autocomplete
        Patcher.after("BetterChatNames", MentionAutocomplete.default.Channel.prototype, "renderContent", 
            (_, args, data)=>{
                if(data) {
                    data.props.children[1].props.children.props.children = this.patchText(data.props.children[1].props.children.props.children)
                } 
            }
        )
        
        // Search Autocomplete
        Patcher.after("BetterChatNames", Search.GroupData.FILTER_IN, "component", 
            (_, args, data)=>{
                if(data) {
                    Patcher.after("BetterChatNames(Searchbar)", data.props, "renderResult", 
                        (_, args, data)=>{
                            data.props.children[1].props.children = this.patchText(data.props.children[1].props.children)
                        }
                    )
                } 
            }
        )

        // Quick Switcher Autocomplete
        Patcher.after("BetterChatNames", QuickSwitcher.Channel.prototype, "renderName",
            (_, args, data)=>{
                if(data) {
                    data.props.children[0].props.children = this.patchText(data.props.children[0].props.children)
                } 
            }
        )}

        this.reloadGuild()
    }

    patchText(channelName) { return channelName.replace(DashRegex, " ").replace(CapitalRegex, letter => letter.toUpperCase()) } // Remove dash + underscore, then capitalise

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