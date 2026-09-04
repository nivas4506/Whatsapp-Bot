export interface SendMessageOptions {
    to: string;
    text: string;
    interactiveButtons?: Array<{
        id: string;
        title: string;
    }>;
    ctaUrl?: {
        title: string;
        url: string;
    };
}
export declare class WhatsAppClient {
    private apiUrl;
    private apiToken;
    private mockMode;
    sentMessages: Array<{
        to: string;
        payload: any;
    }>;
    constructor();
    send(options: SendMessageOptions): Promise<{
        success: boolean;
        messageId: string;
    }>;
}
export declare const whatsappClient: WhatsAppClient;
