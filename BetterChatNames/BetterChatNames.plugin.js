/**
 * @name BetterChatNames
 * @author Break
 * @description Improves chat names by automatically capitalising them, and removing dashes & underlines
 * @version 1.3.1
 * @authorLink https://github.com/Ben-Break
 * @website https://github.com/Ben-Break/BetterDiscordAddons
 * @source https://github.com/Ben-Break/BetterDiscordAddons/tree/main/BetterChatNames
 * @updateUrl https://raw.githubusercontent.com/Ben-Break/BetterDiscordAddons/main/BetterChatNames/BetterChatNames.plugin.js
 */

const Capitalise = true
const RemoveDashes = true
const PatchAutocomplete = true
/*                         ↑↑ 
Toggles changing the names of autocomplete e.g. mention and search (because you still need to type the dashes/underscores)
*/

const PluginName = "BetterChatNames"
const DashRegex = new RegExp("-|_", "g")
const CapitalRegex = new RegExp(/(^\w{1})|(\W\w{1})/g)
const {findModule, findModuleByProps, findModuleByDisplayName, Patcher} = BdApi
const {after} = Patcher

const Channels = findModule(m=>m?.default?.displayName === "ChannelItem")
const Title = findModule(m=>m?.default?.displayName === "HeaderBar")
const Mention = findModule(m=>m?.default?.displayName === "Mention")
const Placeholder = findModuleByDisplayName("ChannelEditorContainer").prototype
const Dropdown1 = findModuleByProps("SingleSelect")
const Dropdown2 = findModuleByProps("FormContextProvider")
const Welcome1 = findModule(m=>m?.default?.displayName === "TextChannelEmptyMessage")
const Welcome2 = findModule(m=>m?.default?.displayName === "RoleRequiredEmptyMessage")
const Inbox = findModule(m=>m?.default?.displayName === "RecentsChannelHeader")
const ChannelsFollowed = findModule(m=>m?.default?.displayName === "IntegrationsChannelFollowing")
const ChatSettings = findModuleByDisplayName("SettingsView").prototype
const MentionAutocomplete = findModule(m=>m.default.displayName === "Autocomplete").default.Channel.prototype
const Search = findModuleByProps("SearchPopoutComponent").GroupData.FILTER_IN
const QuickSwitcher = findModule(m=>m.Channel.displayName === "Channel")

module.exports = class BetterChatNames {
    patchNames() {
        // Chat names
        after(PluginName, Channels, "default", 
            (_, args, data)=>{
                if(data?.props?.children?.props?.children?.[1]?.props?.children?.[0]?.props?.children?.[1]?.props?.children?.[0]?.props?.children){
                    data.props.children.props.children[1].props.children[0].props.children[1].props.children[0].props.children = this.patchText(data.props.children.props.children[1].props.children[0].props.children[1].props.children[0].props.children)
                }
            }
        )

        // Title
        after(PluginName, Title, "default", 
            (_, args, data)=>{
                const TitleBar = data?.props?.children?.props?.children?.[0]?.props?.children
                if(TitleBar?.[1]?.props?.guild) { //If in a server

                    if(TitleBar[2]) { //If in normal chat
                        data.props.children.props.children[0].props.children[0].props.children[1].props.children = this.patchText(TitleBar[0].props.children[1].props.children)
                    }
                    else { //If in a thread
                        data.props.children.props.children[0].props.children[0].props.children[0].props.children[1].props.children = this.patchText(TitleBar[0].props.children[0].props.children[1].props.children)
                    }
                }
                else if(TitleBar?.[2]?.props?.guild) { //If in a server and 'Hide Channels' is installed 

                    if(TitleBar[3]) { //If in normal chat
                        data.props.children.props.children[0].props.children[1].props.children[1].props.children = this.patchText(TitleBar[1].props.children[1].props.children)
                    }
                    else { //If in a thread
                        data.props.children.props.children[0].props.children[0].props.children[0].props.children[1].props.children = this.patchText(TitleBar[0].props.children[0].props.children[1].props.children)
                    }
                }
            }
        )

        // Chat mention
        after(PluginName, Mention, "default", 
            (_, args, data)=>{
                if(data?.props?.role == "link"){ //In chat (and not role mention)
                    data.props.children[1][0] = this.patchText(data.props.children[1][0])
                }
                else if(typeof(data.props.children[1]) == "string"){ //In text area
                    data.props.children[1] = this.patchText(data.props.children[1])
                }
            }
        )

        // Message placeholder
        after(PluginName, Placeholder, "render",
            (_, args, data)=>{
                if(data?.props?.children?.[2].props?.placeholder && data?.props?.children?.[2].props?.channel?.guild_id){ //If has placeholder and is in server
                    data.props.children[2].props.placeholder = this.patchText(data.props.children[2].props.placeholder)
                }
            }
        )

        // Dropdowns 1 (in server settings)
        after(PluginName, Dropdown1, "SingleSelect",
            (_, args, data)=>{
                if(data?.props?.options?.[1]?.channel || data?.props?.options?.[0]?.label?.startsWith("#")) {
                    data.props.options.forEach(e => {
                        if(e.label) {
                            e.label = this.patchText(e.label)
                        }
                    });
                }
            }
        )

        // Dropdowns 2 (follow channel)
        after(PluginName, Dropdown2, "FormContextProvider",
            (_, args, data)=>{
                if(data?.props?.children?.props?.options?.[0].channel) {
                    data.props.children.props.options.forEach(e => {
                        e.label = this.patchText(e.label)
                    });
                }
                else if(data?.props?.children?.[1]?.props?.children?.[0]?.props?.options) {
                    data.props.children[1].props.children[0].props.options.forEach(e => {
                        e.label = this.patchText(e.label)
                    });
                }
            }
        )

        // "Welcome to channel"
        after(PluginName, Welcome1, "default", 
            (_, args, data)=>{
                if(data?.props?.children?.[1]?.props?.children.includes("#")){
                    var str = data.props.children[1].props.children
                    data.props.children[1].props.children = str.substring(0, str.indexOf("#")) + this.patchText(str.substring(str.indexOf("#"))) //Header
                    str = data.props.children[2].props.children[0]
                    data.props.children[2].props.children[0] = str.substring(0, str.indexOf("#")) + this.patchText(str.substring(str.indexOf("#"))) //Description
                }
            }
        )

        // "Welcome to channel" (locked channel)
        after(PluginName, Welcome2, "default", 
            (_, args, data)=>{
                if(data?.props?.children?.[1]?.props?.children.includes("#")){
                    var str = data.props.children[1].props.children
                    data.props.children[1].props.children = str.substring(0, str.indexOf("#")) + this.patchText(str.substring(str.indexOf("#"))) //Header
                    str = data.props.children[2].props.children[0]
                    data.props.children[2].props.children[0] = str.substring(0, str.indexOf("#")) + this.patchText(str.substring(str.indexOf("#"))) //Description
                }
            }
        )

        // Inbox
        after(PluginName, Inbox, "default",
            (_, args, data)=>{
                if(data?.props?.children?.props?.children?.[0]?.props?.channel) {
                    data.props.children.props.children[0].props.channel.name = this.patchText(data.props.children.props.children[0].props.channel.name)
                }
            }
        )

        // Channels Followed
        after(PluginName, ChannelsFollowed, "default",
            (_, args, data)=>{
                data.props.children[2].props.webhooks.forEach(e => {
                    e.source_channel.name = this.patchText(e.source_channel.name)
                });
            }
        )

        // Chat settings title
        after(PluginName, ChatSettings, "renderSidebar", 
            (_, args, data)=>{
                if(data?.props?.children?.[0].props?.children?.props){
                    data.props.children[0].props.children.props.children[1] = this.patchText(data.props.children[0].props.children.props.children[1])
                }
            }
        )

        if(PatchAutocomplete) {

        // Mention Autocomplete
        after(PluginName, MentionAutocomplete, "renderContent", 
            (_, args, data)=>{
                if(data) {
                    data.props.children[1].props.children.props.children = this.patchText(data.props.children[1].props.children.props.children)
                } 
            }
        )

        // Search Autocomplete
        after(PluginName, Search, "component", 
            (_, args, data)=>{
                if(data) {
                    after("BetterChatNames(Searchbar)", data.props, "renderResult", 
                        (_, args, data)=>{
                            data.props.children[1].props.children = this.patchText(data.props.children[1].props.children)
                        }
                    )
                } 
            }
        )

        // Quick Switcher Autocomplete
        after(PluginName, QuickSwitcher.Channel.prototype, "renderName",
            (_, args, data)=>{
                if(data) {
                    data.props.children[0].props.children = this.patchText(data.props.children[0].props.children)
                } 
            }
        )}

        this.reloadServer()
    }

    // Document title (seen in places such as hovering over app on windows)
    onSwitch() {
        if(findModuleByProps("getLastSelectedGuildId").getGuildId()) {
            document.title = this.patchText(document.title)
        }
    }

    patchText(channelName) {
        if(RemoveDashes) {channelName = channelName.replace(DashRegex, " ")}
        if(Capitalise) {channelName = channelName.replace(CapitalRegex, letter => letter.toUpperCase())}
        return channelName
    }

    reloadServer() {
        const transitionTo = findModuleByProps("transitionTo").transitionTo
        const currentServer = findModuleByProps("getLastSelectedGuildId").getGuildId()
        const currentChannel = findModuleByProps("getLastSelectedChannelId").getChannelId()

        if(currentServer) { //If not in DM
            transitionTo(`/channels/@me`)
            setImmediate(()=>transitionTo(`/channels/${currentServer}/${currentChannel}`))
        }
    }

    start() { this.patchNames() }

    stop() {
        Patcher.unpatchAll(PluginName)
        this.reloadServer()
    }
}