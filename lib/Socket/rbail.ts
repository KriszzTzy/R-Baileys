import { proto } from '../../WAProto';

declare namespace imup {
    interface MediaUploadOptions {
        fileEncSha256?: Buffer;
        mediaType?: string;
        newsletter?: boolean;
    }

    type WAMediaUploadFunction = (
        stream: Buffer | NodeJS.ReadableStream, 
        options?: MediaUploadOptions
    ) => Promise<{ url: string; directPath: string }>;

    interface WAMessageContentGenerationOptions {
        upload?: WAMediaUploadFunction;
        mediaCache?: any;
        options?: any;
        logger?: any;
    }

    interface StickerMessage {
        url: string;
        fileSha256: Buffer | string;
        fileEncSha256: Buffer | string;
        mediaKey: Buffer | string;
        mimetype: string;
        directPath: string;
        fileLength: number | string;
        mediaKeyTimestamp: number | string;
        isAnimated?: boolean;
        stickerSentTs?: number | string;
        isAvatar?: boolean;
        isAiSticker?: boolean;
        isLottie?: boolean;
    }

    interface PaymentMessage {
        amount: number;
        currency?: string;
        from?: string;
        expiry?: number;
        sticker?: { stickerMessage: StickerMessage };
        note?: string;
        background?: {
            id?: string;
            fileLength?: string;
            width?: number;
            height?: number;
            mimetype?: string;
            placeholderArgb?: number;
            textArgb?: number;
            subtextArgb?: number;
        };
    }

    interface ProductMessage {
        title: string;
        description: string;
        thumbnail: Buffer | { url: string };
        productId: string;
        retailerId: string;
        url: string;
        body?: string;
        footer?: string;
        buttons?: proto.Message.InteractiveMessage.INativeFlowButton[];
        priceAmount1000?: number | null;
        currencyCode?: string;
    }

    interface InteractiveMessage {
        title: string;
        footer?: string;
        thumbnail?: string;
        image?: string | Buffer | { url: string };
        video?: string | Buffer | { url: string };
        document?: Buffer;
        mimetype?: string;
        fileName?: string;
        jpegThumbnail?: Buffer;
        contextInfo?: {
            mentionedJid?: string[];
            forwardingScore?: number;
            isForwarded?: boolean;
            forwardedNewsletterMessageInfo?: proto.Message.ContextInfo.ForwardedNewsletterMessageInfo;
            externalAdReply?: {
                title?: string;
                body?: string;
                mediaType?: number;
                thumbnailUrl?: string;
                mediaUrl?: string;
                sourceUrl?: string;
                showAdAttribution?: boolean;
                renderLargerThumbnail?: boolean;
                [key: string]: any;
            };
            [key: string]: any;
        };
        externalAdReply?: {
            title?: string;
            body?: string;
            mediaType?: number;
            thumbnailUrl?: string;
            mediaUrl?: string;
            sourceUrl?: string;
            showAdAttribution?: boolean;
            renderLargerThumbnail?: boolean;
            [key: string]: any;
        };
        buttons?: proto.Message.InteractiveMessage.INativeFlowButton[];
        nativeFlowMessage?: {
            messageParamsJson?: string;
            buttons?: proto.Message.InteractiveMessage.INativeFlowButton[];
            [key: string]: any;
        };
    }

    interface AlbumItem {
        image?: { url: string; caption?: string };
        video?: { url: string; caption?: string };
    }

    interface EventMessageLocation {
        degreesLatitude: number;
        degreesLongitude: number;
        name: string;
    }

    interface EventMessage {
        isCanceled?: boolean;
        name: string;
        description: string;
        location?: EventMessageLocation;
        joinLink?: string;
        startTime?: string | number;
        endTime?: string | number;
        extraGuestsAllowed?: boolean;
    }
    
    interface PollVote {
        optionName: string;
        optionVoteCount: string | number;
    }
    
    interface PollResultMessage {
        name: string;
        pollVotes: PollVote[];
        newsletter?: {
            newsletterName: string;
            newsletterJid: string;
        };
    }

    interface OrderMessage {
        thumbnail?: Buffer | string,
        itemCount?: string | number,
        message: string,
        orderTitle: string,
        totalAmount1000?: string | number,
        totalCurrencyCode?: string
    }
    
    interface GroupStatus {
        message?: any;
        image?: string | Buffer | { url: string };
        video?: string | Buffer | { url: string };
        text?: string;
        caption?: string;
        document?: string | Buffer | { url: string };
        [key: string]: any;
    }
    
    interface GroupLabel {
        labelText: string;
    }

    interface RichMessageTextOptions {
        hyperlink?: boolean;
        citation?: boolean;
        latex?: boolean;
    }

    interface RichMessageCode {
        language: string;
        content: string;
    }

    interface RichMessageReel {
        username?: string;
        title?: string;
        profileIconUrl?: string;
        profile_url?: string;
        thumbnailUrl?: string;
        thumbnail?: string;
        videoUrl?: string;
        url?: string;
        reels_title?: string;
        likes_count?: number;
        like?: number;
        shares_count?: number;
        share?: number;
        view_count?: number;
        view?: number;
        reel_source?: string;
        source?: string;
        is_verified?: boolean;
        verified?: boolean;
    }

    interface RichMessageProduct {
        title: string;
        brand?: string;
        price: string;
        sale_price?: string;
        product_url?: string;
        url?: string;
        image_url?: string;
        image?: string;
        icon_url?: string;
        icon?: string;
    }

    interface RichMessagePost {
        title?: string;
        subtitle?: string;
        username?: string;
        profile_picture_url?: string;
        profile_url?: string;
        is_verified?: boolean;
        verified?: boolean;
        thumbnail_url?: string;
        thumbnail?: string;
        post_caption?: string;
        caption?: string;
        likes_count?: number;
        like?: number;
        comments_count?: number;
        comment?: number;
        shares_count?: number;
        share?: number;
        post_url?: string;
        url?: string;
        post_deeplink?: string;
        deeplink?: string;
        source_app?: string;
        source?: string;
        footer_label?: string;
        footer?: string;
        footer_icon?: string;
        icon?: string;
        orientation?: 'LANDSCAPE' | 'PORTRAIT';
        post_type?: 'VIDEO' | 'IMAGE';
    }

    interface RichMessage {
        title?: string;
        subtitle?: string;
        body?: string;
        footer?: string;
        text?: string;
        textOptions?: RichMessageTextOptions;
        code?: RichMessageCode;
        table?: string[][];
        sources?: [string, string, string][];
        reels?: RichMessageReel | RichMessageReel[];
        images?: string | string[];
        videos?: string | string[];
        products?: RichMessageProduct | RichMessageProduct[];
        posts?: RichMessagePost | RichMessagePost[];
        tip?: string;
        suggestions?: string | string[];
        contextInfo?: any;
        forwarded?: boolean;
        includesUnifiedResponse?: boolean;
        includesSubmessages?: boolean;
    }
 
    interface MessageContent {
        requestPaymentMessage?: PaymentMessage;
        productMessage?: ProductMessage;
        interactiveMessage?: InteractiveMessage;
        albumMessage?: AlbumItem[];
        eventMessage?: EventMessage;
        pollResultMessage?: PollResultMessage;
        groupStatus?: GroupStatus;
        orderMessage?: OrderMessage;
        groupLabel?: GroupLabel;
        richMessage?: RichMessage;
        sender?: string;
    }

    interface MessageOptions {
        quoted?: proto.IWebMessageInfo;
        filter?: boolean;
    }

    interface Utils {
        prepareWAMessageMedia: (media: any, options: WAMessageContentGenerationOptions) => Promise<any>;
        generateWAMessageContent: (content: any, options: WAMessageContentGenerationOptions) => Promise<any>;
        generateWAMessageFromContent: (jid: string, content: any, options?: any) => Promise<any>;
        generateWAMessage: (jid: string, content: any, options?: any) => Promise<any>;
        generateMessageID: () => string;
    }
}

declare class imup {
    constructor(
        utils: imup.Utils,
        waUploadToServer: imup.WAMediaUploadFunction,
        relayMessageFn?: (jid: string, content: any, options?: any) => Promise<any>
    );
    
    detectType(content: imup.MessageContent): 'PAYMENT' | 'PRODUCT' | 'INTERACTIVE' | 'ALBUM' | 'EVENT' | 'POLL_RESULT' | 'GROUP_STATUS' | 'ORDER' | 'GROUP_LABEL' | 'RICH_MESSAGE' | null;

    handlePayment(
        content: { requestPaymentMessage: imup.PaymentMessage },
        quoted?: proto.IWebMessageInfo
    ): Promise<{ requestPaymentMessage: proto.Message.RequestPaymentMessage }>;

    handleProduct(
        content: { productMessage: imup.ProductMessage },
        jid: string,
        quoted?: proto.IWebMessageInfo
    ): Promise<{ viewOnceMessage: proto.Message.ViewOnceMessage }>;

    handleInteractive(
        content: { interactiveMessage: imup.InteractiveMessage },
        jid: string,
        quoted?: proto.IWebMessageInfo
    ): Promise<{ interactiveMessage: proto.Message.InteractiveMessage }>;

    handleAlbum(
        content: { albumMessage: imup.AlbumItem[] },
        jid: string,
        quoted?: proto.IWebMessageInfo
    ): Promise<any>;

    handleEvent(
        content: { eventMessage: imup.EventMessage },
        jid: string,
        quoted?: proto.IWebMessageInfo
    ): Promise<any>;
    
    handlePollResult(
        content: { pollResultMessage: imup.PollResultMessage },
        jid: string,
        quoted?: proto.IWebMessageInfo
    ): Promise<any>;

    handleOrderMessage(
        content: { orderMessage: imup.OrderMessage },
        jid: string,
        quoted?: proto.IWebMessageInfo
    ): Promise<any>;
    
    handleGroupStory(
        content: { groupStatus: imup.GroupStatus },
        jid: string,
        quoted?: proto.IWebMessageInfo
    ): Promise<any>;
    
    handleGbLabel(
        content: { groupLabel: imup.GroupLabel },
        jid: string,
    ): Promise<any>;

    handleRichMessage(
        content: { richMessage: imup.RichMessage },
        jid: string,
        quoted?: proto.IWebMessageInfo
    ): Promise<any>;
}

export = imup;