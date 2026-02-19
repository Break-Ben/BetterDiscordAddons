/**
 * @name BetterChatNames
 * @author Break
 * @description Improves chat names by automatically capitalising them and/or removing dashes/underscores
 * @version 1.9.0
 * @authorLink https://github.com/Break-Ben
 * @website https://github.com/Break-Ben/BetterDiscordAddons
 * @source https://github.com/Break-Ben/BetterDiscordAddons/tree/main/BetterChatNames
 * @updateUrl https://raw.githubusercontent.com/Break-Ben/BetterDiscordAddons/main/BetterChatNames/BetterChatNames.plugin.js
 */

const defaultSettings = {
    capitalise: true,
    removeDashes: true,
    removeEmojis: false,
    patchUnrestricted: true,
    capitalOverrides: 'and, or, of, the, for, to, at, a, FAQ, VC, GitHub'
}

const unrestrictedChannels = {
    voice: 2,
    thread: 11,
    stage: 13
}
const regex = {
    dash: /-|_/g,
    capital: /(?<=(^|[^\p{L}'’]))\p{L}/gu,
    word: /\b\p{L}+\b/gu,
    emoji: /([-_]?\p{Extended_Pictographic}[-_┃]?)|(\uFE0F\u20E3)/gu
}

let titleObserver
const { Webpack, Patcher, Utils, Data, UI } = new BdApi('BetterChatNames')
const { getModule, getByStrings, getByKeys, getByPrototypeKeys } = Webpack
const { findInTree } = Utils
const searchOptions = { walkable: ['children', 'props'] } // For Utils.findInTree

const currentServer = getByKeys('getLastSelectedGuildId')
const currentChannel = getByKeys('getLastSelectedChannelId')
const transitionTo = getByStrings('transitionTo - Transitioning to', { searchExports: true })

const sidebar = getModule(m => m?.render?.toString()?.includes('.CHANNEL'))
const header = getByStrings('.HEADER_BAR)', { defaultExport: false })
const placeholder = getByPrototypeKeys('getPlaceholder').prototype
const mention = getByStrings('channelWithIcon', { defaultExport: false })

const debounceTimeMs = 1000

module.exports = class BetterChatNames {
    start() {
        this.settings = Object.assign({}, defaultSettings, Data.load('settings'))
        this.updateOverrideMap()
        this.observeAppTitle()
        this.patchNames()
        this.refreshChannel()
    }

    stop() {
        titleObserver.disconnect()
        Patcher.unpatchAll()
        this.refreshChannel()
    }

    getSettingsPanel = () => UI.buildSettingsPanel({
        settings: [
            {
                id: 'capitalise',
                name: 'Capitalise Words',
                type: 'switch',
                value: this.settings.capitalise
            },
            {
                id: 'removeDashes',
                name: 'Remove Dashes and Underscores',
                type: 'switch',
                value: this.settings.removeDashes
            },
            {
                id: 'removeEmojis',
                name: 'Remove Emojis',
                type: 'switch',
                value: this.settings.removeEmojis
            },
            {
                id: 'patchUnrestricted',
                name: 'Patch Unrestricted Channels',
                note: 'Change the names of channels that can already contain capital letters and spaces, such as voice channels, threads, and stages.',
                type: 'switch',
                value: this.settings.patchUnrestricted
            },
            {
                id: 'capitalOverrides',
                name: 'Capitalisation Overrides',
                note: 'A comma-separated list of words with custom capitalisations. For example: "and, FAQ, GitHub, iPhone". Only enabled if "Capitalise Words" is enabled, and can be cleared to be disabled.',
                type: 'text',
                inline: false,
                value: this.settings.capitalOverrides
            }
        ],
        onChange: (_, id, value) => {
            if (id === 'capitalOverrides') {
                clearTimeout(this.debounceTimer)
                this.debounceTimer = setTimeout(() => {
                    this.settings[id] = value
                    Data.save('settings', this.settings)
                    this.updateOverrideMap()
                    if (this.settings.capitalise)
                        this.refreshChannel()
                }, debounceTimeMs)
                return
            }
            
            this.settings[id] = value
            Data.save('settings', this.settings)
            this.refreshChannel()
        }
    })

    observeAppTitle() {
        let lastUnpatchedAppTitle
        titleObserver = new MutationObserver(() => {
            if (document.title !== lastUnpatchedAppTitle) { // Resolves conflicts with EditChannels' MutationObserver
                lastUnpatchedAppTitle = document.title
                this.patchAppTitle()
            }
        })
        titleObserver.observe(document.querySelector('title'), { childList: true })
    }

    patchAppTitle() {
        const patchedTitle = this.patchText(document.title)

        if (currentServer?.getGuildId() && document.title !== patchedTitle) // If in server and title not already patched
            document.title = patchedTitle
    }

    patchNames() {
        this.patchSidebar()
        this.patchHeader()
        this.patchChatPlaceholder()
        this.patchMention()
    }

    patchSidebar() {
        Patcher.after(sidebar, 'render', (_, __, data) => {
            const channelName = findInTree(data, prop => prop?.name, searchOptions)
            const channelType = findInTree(data, prop => prop?.channel, searchOptions).channel.type

            if (!Object.values(unrestrictedChannels).includes(channelType) || this.settings.patchUnrestricted) // If not a voice/stage channel or patchUnrestricted is enabled
                channelName.name = this.patchText(channelName.name)
        })
    }

    patchHeader() {
        Patcher.after(header, 'A', (_, __, data) => {
            const rootChannel = findInTree(data, prop => prop?.level, searchOptions)
            if (!rootChannel)
                return

            if (rootChannel.level === 1) // If not in thread
                rootChannel.children.props.children[2] = this.patchText(rootChannel.children.props.children[2])
            else if (rootChannel.level === 2) { // If in thread
                rootChannel.children = this.patchText(rootChannel.children)
                if (this.settings.patchUnrestricted) {
                    const threadName = findInTree(data, prop => Array.isArray(prop) && prop[1] === ' ', searchOptions)
                    threadName[2] = this.patchText(threadName[2])
                }
            }
        })
    }

    patchChatPlaceholder() {
        Patcher.after(placeholder, 'render', (_, __, data) => {
            const textArea = findInTree(data, prop => prop.channel, searchOptions)
            const isThread = textArea.channel.type === unrestrictedChannels.thread

            if (textArea.channel.guild_id && (!isThread || this.settings.patchUnrestricted) && !textArea.disabled && textArea.type.analyticsName === 'normal') { // If in a server, not in a thread (or patchUnrestricted is enabled), can message and not editing a message
                const splitIndex = (isThread ? textArea.placeholder.indexOf('"') : textArea.placeholder.indexOf('#')) + 1 // Indicates where the channel name starts
                textArea.placeholder = textArea.placeholder.substring(0, splitIndex) + this.patchText(textArea.placeholder.substr(splitIndex))
            }
        })
    }

    patchMention() {
        Patcher.after(mention, 'A', (_, __, data) => {
            const channelName = findInTree(data, prop => typeof prop.children === 'string', searchOptions)

            if (data.props.className.includes('iconMentionText') || this.settings.patchUnrestricted) // If is a normal chat mention (not a thread) or patchUnrestricted is enabled
                channelName.children = this.patchText(channelName.children)
        })
    }

    patchText(text) {
        if (this.settings.removeEmojis)
            text = text.replace(regex.emoji, '')

        if (this.settings.removeDashes)
            text = text.replace(regex.dash, ' ')

        if (this.settings.capitalise) {
            text = text.replace(regex.capital, letter => letter.toUpperCase())

            if (this.settings.capitalOverrides) {
                let wordCount = 0
                text = text.replace(regex.word, word => {
                    wordCount++
                    const wordLower = word.toLowerCase()
                    if (!this.overrideMap.has(wordLower))
                        return word

                    const wordOverride = this.overrideMap.get(wordLower)
                    if (wordCount == 1 && wordOverride === wordLower)
                        return word

                    return wordOverride
                })
            }
        }

        return text
    }

    refreshChannel() {
        const currentServerId = currentServer?.getGuildId()
        const currentChannelId = currentChannel?.getChannelId()

        if (currentServerId) { // If not in a DM
            transitionTo('/channels/@me')
            setImmediate(() => transitionTo(`/channels/${currentServerId}/${currentChannelId}`))
        }
    }

    updateOverrideMap() {
        // Maps lowercase words to their custom capitalised versions
        this.overrideMap = new Map((this.settings.capitalOverrides).split(',').map(w => w.trim()).filter(w => w).map(w => [w.toLowerCase(), w]))
    }
}