export function normalizeMetaWebhook(payload) {
    const normalizedList = [];
    if (!payload.entry || !Array.isArray(payload.entry)) {
        return normalizedList;
    }
    for (const entry of payload.entry) {
        if (!entry.changes || !Array.isArray(entry.changes))
            continue;
        for (const change of entry.changes) {
            if (change.field !== 'messages' || !change.value?.messages)
                continue;
            for (const msg of change.value.messages) {
                let textContent = '';
                let messageType = 'unsupported';
                let interactiveId;
                if (msg.type === 'text' && msg.text?.body) {
                    textContent = msg.text.body.trim();
                    messageType = 'text';
                }
                else if (msg.type === 'interactive') {
                    if (msg.interactive?.type === 'button_reply' && msg.interactive.button_reply) {
                        textContent = msg.interactive.button_reply.title;
                        interactiveId = msg.interactive.button_reply.id;
                        messageType = 'button_reply';
                    }
                    else if (msg.interactive?.type === 'list_reply' && msg.interactive.list_reply) {
                        textContent = msg.interactive.list_reply.title;
                        interactiveId = msg.interactive.list_reply.id;
                        messageType = 'button_reply';
                    }
                }
                else if (msg.type === 'button' && msg.button) {
                    textContent = msg.button.text;
                    interactiveId = msg.button.payload;
                    messageType = 'button_reply';
                }
                const timestampSeconds = parseInt(msg.timestamp, 10);
                const timestamp = !isNaN(timestampSeconds)
                    ? new Date(timestampSeconds * 1000)
                    : new Date();
                normalizedList.push({
                    providerMessageId: msg.id,
                    from: msg.from,
                    timestamp,
                    text: textContent,
                    type: messageType,
                    interactiveId,
                });
            }
        }
    }
    return normalizedList;
}
