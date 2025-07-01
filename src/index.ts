import { findByProps } from "@vendetta/metro"
import { React } from "@vendetta/metro/common"
import { patcher } from "@vendetta"

const SendButton = findByProps("ChatInputSendButton")
const ChatInput = findByProps("ChatInput", "ChatInputMention")
const Messages = findByProps("sendMessage", "receiveMessage")

let unpatches = []

export default {
    onLoad: () => {
        // Hide the send button
        unpatches.push(
            patcher.before("type", SendButton.ChatInputSendButton, (args) => {
                args[0].canSendMessage = false
                args[0].canSendVoiceMessage = false
            })
        )

        // Intercept return key in the message input
        unpatches.push(
            patcher.after("type", ChatInput.ChatInput, ([props], ret) => {
                const inputRef = React.useRef(null)

                React.useEffect(() => {
                    const input = inputRef.current
                    if (!input) return

                    const original = input.props.onSubmitEditing
                    input.props.onSubmitEditing = async () => {
                        const content = props?.textValue?.trim?.()
                        if (!content || !props?.channel?.id) return

                        Messages.sendMessage(props.channel.id, {
                            content,
                            invalidEmojis: [],
                            validNonShortcutEmojis: [],
                        })
                    }

                    return () => {
                        input.props.onSubmitEditing = original
                    }
                }, [])

                return React.cloneElement(ret, { ref: inputRef })
            })
        )
    },

    onUnload: () => {
        for (const unpatch of unpatches) unpatch?.()
        unpatches = []
    }
}
