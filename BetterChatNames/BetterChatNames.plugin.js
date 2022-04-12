/**
 * @name BetterChatNames
 * @author Break
 * @description Improves chat names by automatically capitalising them, and removing dashes + underlines
 * @version 1.2.0
 * @authorLink https://github.com/Ben-Break
 * @website https://github.com/Ben-Break/BetterDiscordAddons
 * @source https://github.com/Ben-Break/BetterDiscordAddons/tree/main/BetterChatNames
 * @updateUrl https://raw.githubusercontent.com/Ben-Break/BetterDiscordAddons/main/BetterChatNames/BetterChatNames.plugin.js
 */

const PatchAutocomplete = true
/*                         ↑↑ 
Toggles changing the names of autocomplete e.g. mention and search (because you still need to type the dashes/underscores)
*/

const Patcher = BdApi.Patcher
const DashRegex = new RegExp("-|_", "g")
const CapitalRegex = new RegExp(/(^\w{1})|(\W\w{1})/g)

const Channels = BdApi.findModule(m=>m?.default?.displayName === "ChannelItem")
const Title = BdApi.findModule(m=>m?.default?.displayName === "HeaderBar")
const Mention = BdApi.findModule(m=>m?.default?.displayName === "Mention")
const Placeholder = BdApi.findModuleByDisplayName("ChannelEditorContainer")
const Dropdown1 = BdApi.findModuleByProps("SingleSelect")
const Dropdown2 = BdApi.findModuleByProps("FormContextProvider")
const Welcome1 = BdApi.findModule(m=>m?.default?.displayName === "TextChannelEmptyMessage")
const Welcome2 = BdApi.findModule(m=>m?.default?.displayName === "RoleRequiredEmptyMessage")
const ChatSettings = BdApi.findModuleByDisplayName("SettingsView")
const MentionAutocomplete = BdApi.findModule(m=>m.default.displayName === "Autocomplete")
const Search = BdApi.findModuleByProps("SearchPopoutComponent")
const QuickSwitcher = BdApi.findModule(m=>m.Channel.displayName === "Channel")

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
                if(data?.props?.children?.[0]){
                    data.props.children[1][0] = this.patchText(data.props.children[1][0])
                }
            }
        )

        // Message placeholder
        Patcher.after("BetterChatNames", Placeholder.prototype, "render",
            (_, args, data)=>{
                if(data?.props?.children?.[2].props?.channel?.placeholder && data?.props?.children?.[2].props?.channel?.guild_id){
                    data.props.children[2].props.placeholder = this.patchText(data.props.children[2].props.placeholder)
                }
            }
        )

        // Dropdowns 1 (in server settings)
        Patcher.after("BetterChatNames", Dropdown1, "SingleSelect",
            (_, args, data)=>{
                if(data?.props?.options?.[1]?.channel || data?.props?.options?.[0]?.label?.startsWith("#")) {
                    data.props.options.forEach(e => {
                        e.label = this.patchText(e.label)
                    });
                }
            }
        )

        // Dropdowns 2 (follow channel)
        Patcher.after("BetterChatNames", Dropdown2, "FormContextProvider",
            (_, args, data)=>{
                if(data?.props?.children?.props?.options?.[0].channel) {
                    data.props.children.props.options.forEach(e => {
                        e.label = this.patchText(e.label)
                    });
                }
            }
        )

        // "Welcome to channel"
        Patcher.after("BetterChatNames", Welcome1, "default", 
            (_, args, data)=>{
                if(data?.props?.children?.[1]?.props?.children.includes("#")){
                    var str = data.props.children[1].props.children
                    data.props.children[1].props.children = str.substring(0, str.indexOf("#")) + this.patchText(str.substring(str.indexOf("#")))
                    str = data.props.children[2].props.children[0]
                    data.props.children[2].props.children[0] = str.substring(0, str.indexOf("#")) + this.patchText(str.substring(str.indexOf("#")))
                }
            }
        )

        // "Welcome to channel" (locked channel)
        Patcher.after("BetterChatNames", Welcome2, "default", 
            (_, args, data)=>{
                if(data?.props?.children?.[1]?.props?.children.includes("#")){
                    var str = data.props.children[1].props.children
                    data.props.children[1].props.children = str.substring(0, str.indexOf("#")) + this.patchText(str.substring(str.indexOf("#")))
                    str = data.props.children[2].props.children[0]
                    data.props.children[2].props.children[0] = str.substring(0, str.indexOf("#")) + this.patchText(str.substring(str.indexOf("#")))
                }
            }
        )

        // Chat settings title
        Patcher.after("BetterChatNames", ChatSettings.prototype, "renderSidebar", 
            (_, args, data)=>{
                if(data?.props?.children?.[0].props?.children?.props){
                    data.props.children[0].props.children.props.children[1] = this.patchText(data.props.children[0].props.children.props.children[1])
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

    stop() {
        Patcher.unpatchAll("BetterChatNames")
        this.reloadGuild()
    }

    patchText(channelName) { return channelName.replace(DashRegex, " ").replace(CapitalRegex, letter => letter.toUpperCase()) } // Remove dash + underscore, then capitalise

    reloadGuild() {
        const currentGuildId = BdApi.findModuleByProps("getLastSelectedGuildId").getGuildId()
        const currentChannelId = BdApi.findModuleByProps("getLastSelectedChannelId").getChannelId()
        const transitionTo = BdApi.findModuleByProps("transitionTo").transitionTo

        if(currentGuildId) { // Checks if you're not in DM
            transitionTo(`/channels/@me`)
            setImmediate(()=>transitionTo(`/channels/${currentGuildId}/${currentChannelId}`))
        }
    }
}