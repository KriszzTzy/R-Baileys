const WAProto = require('../../WAProto').proto;
const Utils_1 = require('../Utils');
const crypto = require('crypto');

function extractIE(text, { extract = true, hyperlink = true, citation = true, latex = true } = {}) {
	if (!extract) {
		return {
			text,
			ie: [],
		};
	}
	let ie = [],
		result = '',
		last = 0,
		citation_index = 1,
		hyperlink_index = 0,
		latex_index = 0,
		stack = [];
	for (let i = 0; i < text.length; i++) {
		if (text[i] == '[' && text[i - 1] != '\\') {
			stack.push(i);
		} else if (text[i] == ']' && (text[i + 1] == '(' || text[i + 1] == '<')) {
			let start = stack.pop();
			if (start == null) continue;
			let open = text[i + 1],
				close = open == '(' ? ')' : '>',
				type = open == '(' ? 'link' : 'latex',
				end = i + 2,
				depth = 1;
			while (end < text.length && depth) {
				if (text[end] == open && text[end - 1] != '\\') depth++;
				else if (text[end] == close && text[end - 1] != '\\') depth--;
				end++;
			}
			if (depth) continue;
			let raw = text.slice(start + 1, i).trim(),
				url = text.slice(i + 2, end - 1).trim(),
				key,
				tag,
				data;
			if (type == 'latex') {
				if (!latex) continue;
				let [txt = '', width = null, height = null, font_height = null, padding = null] = raw.split('|');
				key = `\u004E\u0049\u0058\u0045\u004C_LATEX_${latex_index++}`;
				tag = `{{${key}}}${txt || 'image'}{{/${key}}}`;
				data = {
					type: 'latex',
					ie: {
						key,
						text: txt,
						url,
						width,
						height,
						font_height,
						padding,
					},
				};
			} else if (raw) {
				if (!hyperlink) continue;
				key = `\u004E\u0049\u0058\u0045\u004C_HYPERLINK_${hyperlink_index++}`;
				tag = `{{${key}}}${url}{{/${key}}}`;
				data = {
					type: 'hyperlink',
					ie: {
						key,
						text: raw,
						url,
					},
				};
			} else {
				if (!citation) continue;
				key = `\u004E\u0049\u0058\u0045\u004C_CITATION_${citation_index - 1}`;
				tag = `{{${key}}}${url}{{/${key}}}`;
				data = {
					type: 'citation',
					ie: {
						reference_id: citation_index++,
						key,
						text: '',
						url,
					},
				};
			}
			result += text.slice(last, start) + tag;
			last = end;
			ie.push(data);
			i = end - 1;
		}
	}
	result += text.slice(last);
	return {
		text: result,
		ie,
	};
}

class BaseBuilder {
	constructor() {
		this._title = '';
		this._subtitle = '';
		this._body = '';
		this._footer = '';
		this._contextInfo = {};
		this._extraPayload = {};
	}

	setTitle(title) {
		if (typeof title !== 'string') {
			throw new TypeError('Title must be a string');
		}
		this._title = title;
		return this;
	}

	setSubtitle(subtitle) {
		if (typeof subtitle !== 'string') {
			throw new TypeError('Subtitle must be a string');
		}
		this._subtitle = subtitle;
		return this;
	}

	setBody(body) {
		if (typeof body !== 'string') {
			throw new TypeError('Body must be a string');
		}
		this._body = body;
		return this;
	}

	setFooter(footer) {
		if (typeof footer !== 'string') {
			throw new TypeError('Footer must be a string');
		}
		this._footer = footer;
		return this;
	}

	setContextInfo(obj) {
		if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
			throw new TypeError('ContextInfo must be a plain object');
		}
		this._contextInfo = obj;
		return this;
	}

	addPayload(obj) {
		if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
			throw new TypeError('Payload must be a plain object');
		}
		Object.assign(this._extraPayload, obj);
		return this;
	}
}

class AIRich extends BaseBuilder {
	#client;

	constructor(client) {
		if (!client) {
			throw new Error('Socket is required');
		}
		super();
		this.#client = client;
		this._contextInfo = {};
		this._submessages = [];
		this._sections = [];
		this._richResponseSources = [];
	}

	static newLayout(name, data) {
		return {
			view_model: {
				[Array.isArray(data) ? 'primitives' : 'primitive']: data,
				__typename: `GenAI${name}LayoutViewModel`,
			},
		};
	}

	addSubmessage(submessage) {
		const items = Array.isArray(submessage) ? submessage : [submessage];
		for (const item of items) {
			if (typeof item !== 'object' || item === null || Array.isArray(item)) {
				throw new TypeError('Submessage must be a plain object or array of plain objects');
			}
			this._submessages.push(item);
		}
		return this;
	}

	addSection(section) {
		const items = Array.isArray(section) ? section : [section];
		for (const item of items) {
			if (typeof item !== 'object' || item === null || Array.isArray(item)) {
				throw new TypeError('Section must be a plain object or array of plain objects');
			}
			this._sections.push(item);
		}
		return this;
	}

	addText(text, { hyperlink = true, citation = true, latex = true } = {}) {
		if (typeof text != 'string') {
			throw new TypeError('Text must be a string');
		}

		const extractedIE = extractIE(text, { hyperlink, citation, latex });
		const inline_entities = extractedIE.ie.map(({ type, ie }) => {
			if (type == 'hyperlink') {
				return {
					key: ie.key,
					metadata: {
						display_name: ie.text,
						is_trusted: true,
						url: ie.url,
						__typename: 'GenAIInlineLinkItem',
					},
				};
			}
			if (type == 'citation') {
				return {
					key: ie.key,
					metadata: {
						reference_id: ie.reference_id,
						reference_url: ie.url,
						reference_title: ie.url,
						reference_display_name: ie.url,
						sources: [],
						__typename: 'GenAISearchCitationItem',
					},
				};
			}
			if (type == 'latex') {
				return {
					key: ie.key,
					metadata: {
						latex_expression: ie.text,
						latex_image: {
							url: ie.url,
							width: Number(ie.width) || 100,
							height: Number(ie.height) || 100,
						},
						font_height: Number(ie.font_height) || 83.333333333333,
						padding: Number(ie.padding) || 15,
						__typename: 'GenAILatexItem',
					},
				};
			}
			return null;
		}).filter(Boolean);

		this._submessages.push({ messageType: 2, messageText: extractedIE.text });
		this._sections.push(
			AIRich.newLayout('Single', {
				text: extractedIE.text,
				...(inline_entities.length && { inline_entities }),
				__typename: 'GenAIMarkdownTextUXPrimitive',
			})
		);
		return this;
	}

	addCode(language, code) {
		if (typeof language !== 'string' || typeof code !== 'string') {
			throw new TypeError('Language and code must be a string');
		}
		const meta = AIRich.tokenizer(code, language);
		this._submessages.push({
			messageType: 5,
			codeMetadata: {
				codeLanguage: language,
				codeBlocks: meta.codeBlock,
			},
		});
		this._sections.push(
			AIRich.newLayout('Single', {
				language,
				code_blocks: meta.unified_codeBlock,
				__typename: 'GenAICodeUXPrimitive',
			})
		);
		return this;
	}

	addTable(table) {
		if (!Array.isArray(table)) {
			throw new TypeError('Table must be an array');
		}
		const meta = AIRich.toTableMetadata(table);
		this._submessages.push({
			messageType: 4,
			tableMetadata: {
				title: meta.title,
				rows: meta.rows,
			},
		});
		this._sections.push(
			AIRich.newLayout('Single', {
				rows: meta.unified_rows,
				__typename: 'GenATableUXPrimitive',
			})
		);
		return this;
	}

	addSource(sources = []) {
		if (!(Array.isArray(sources) && (sources.every((item) => typeof item === 'string') || sources.every((item) => Array.isArray(item) && item.every((v) => typeof v === 'string'))))) {
			throw new TypeError('Sources must be a string array or an array of string arrays');
		}
		if (sources.every((item) => typeof item === 'string')) {
			sources = [sources];
		}
		const source = sources.map(([profile_url, url, text]) => ({
			source_type: 'THIRD_PARTY',
			source_display_name: text ?? '',
			source_subtitle: 'AI',
			source_url: url ?? '',
			favicon: {
				url: profile_url ?? '',
				mime_type: 'image/jpeg',
				width: 16,
				height: 16,
			},
		}));
		this._sections.push(
			AIRich.newLayout('Single', {
				sources: source,
				__typename: 'GenAISearchResultPrimitive',
			})
		);
		return this;
	}

	addReels(reelsItems = []) {
		if (!((reelsItems && typeof reelsItems === 'object' && !Array.isArray(reelsItems)) ||
			(Array.isArray(reelsItems) && reelsItems.every((item) => item && typeof item === 'object' && !Array.isArray(item))))) {
			throw new TypeError('Reels items must be an object or an array of objects');
		}
		if (!Array.isArray(reelsItems)) {
			reelsItems = [reelsItems];
		}
		this._submessages.push({
			messageType: 9,
			contentItemsMetadata: {
				contentType: 1,
				itemsMetadata: reelsItems.map((item) => ({
					reelItem: {
						title: item.username ?? '',
						profileIconUrl: item.profileIconUrl ?? item.profile_url ?? '',
						thumbnailUrl: item.thumbnailUrl ?? item.thumbnail ?? '',
						videoUrl: item.videoUrl ?? item.url ?? '',
					},
				})),
			},
		});
		reelsItems.forEach((item, idx) => {
			this._richResponseSources.push({
				provider: '\u004E\u0049\u0058\u0045\u004C',
				thumbnailCDNURL: item.thumbnailUrl ?? item.thumbnail ?? '',
				sourceProviderURL: item.videoUrl ?? item.url ?? '',
				sourceQuery: '',
				faviconCDNURL: item.profileIconUrl ?? item.profile_url ?? '',
				citationNumber: idx + 1,
				sourceTitle: item.username ?? '',
			});
		});
		this._sections.push(
			AIRich.newLayout('HScroll', reelsItems.map((item) => ({
				reels_url: item.videoUrl ?? item.url ?? '',
				thumbnail_url: item.thumbnailUrl ?? item.thumbnail ?? '',
				creator: item.username ?? item.title ?? '',
				avatar_url: item.profileIconUrl ?? item.profile_url ?? '',
				reels_title: item.reels_title ?? item.title ?? '',
				likes_count: item.likes_count ?? item.like ?? 0,
				shares_count: item.shares_count ?? item.share ?? 0,
				view_count: item.view_count ?? item.view ?? 0,
				reel_source: item.reel_source ?? item.source ?? 'IG',
				is_verified: !!(item.is_verified || item.verified),
				__typename: 'GenAIReelPrimitive',
			})))
		);
		return this;
	}

	addImage(imageUrl) {
		if (!(typeof imageUrl === 'string' || (Array.isArray(imageUrl) && imageUrl.every((v) => typeof v === 'string')))) {
			throw new TypeError('imageUrl must be a string or array of strings');
		}
		const imageUrls = Array.isArray(imageUrl)
			? imageUrl.map((url) => ({
					imagePreviewUrl: url,
					imageHighResUrl: url,
					sourceUrl: 'https://krizx.my.id/',
				}))
			: [{
					imagePreviewUrl: imageUrl,
					imageHighResUrl: imageUrl,
					sourceUrl: 'https://krizx.my.id/',
				}];
		this._submessages.push({
			messageType: 1,
			gridImageMetadata: {
				gridImageUrl: {
					imagePreviewUrl: Array.isArray(imageUrl) ? imageUrl[0] : imageUrl,
				},
				imageUrls,
			},
		});
		imageUrls.forEach(({ imagePreviewUrl }) => {
			this._sections.push(
				AIRich.newLayout('Single', {
					media: { url: imagePreviewUrl, mime_type: 'image/png' },
					imagine_type: 'IMAGE',
					status: { status: 'READY' },
					__typename: 'GenAIImaginePrimitive',
				})
			);
		});
		return this;
	}

	addVideo(videoUrl) {
		if (!(typeof videoUrl === 'string' || (Array.isArray(videoUrl) && videoUrl.every((v) => typeof v === 'string')))) {
			throw new TypeError('videoUrl must be a string or array of strings');
		}
		const videoUrls = (Array.isArray(videoUrl) ? videoUrl : [videoUrl]).map((item) => {
			const [url, duration = 0] = item.split('|');
			return {
				videoPreviewUrl: url,
				videoHighResUrl: url,
				duration: Number(duration) || 0,
				sourceUrl: 'https://krizx.my.id/',
			};
		});
		this._submessages.push({
			messageType: 2,
			messageText: '[ CANNOT_LOAD_VIDEO - NIXEL ]',
		});
		videoUrls.forEach(({ videoPreviewUrl, duration = 0 }) => {
			this._sections.push(
				AIRich.newLayout('Single', {
					media: { url: videoPreviewUrl, mime_type: 'video/mp4', duration },
					imagine_type: 'ANIMATE',
					status: { status: 'READY' },
					__typename: 'GenAIImaginePrimitive',
				})
			);
		});
		return this;
	}

	addProduct(data = {}) {
		if (!((data && typeof data === 'object' && !Array.isArray(data)) ||
			(Array.isArray(data) && data.every((item) => item && typeof item === 'object' && !Array.isArray(item))))) {
			throw new TypeError('Product items must be an object or an array of objects');
		}
		this._submessages.push({
			messageType: 2,
			messageText: '[ CANNOT_LOAD_PRODUCT - NIXEL ]',
		});
		const items = Array.isArray(data) ? data : [data];
		const product = items.map((item) => ({
			title: item.title,
			brand: item.brand,
			price: item.price,
			sale_price: item.sale_price,
			product_url: item.product_url ?? item.url,
			image: { url: item.image_url ?? item.image },
			additional_images: [{ url: item.icon_url ?? item.icon }],
			__typename: 'GenAIProductItemCardPrimitive',
		}));
		this._sections.push(AIRich.newLayout(Array.isArray(data) ? 'HScroll' : 'Single', Array.isArray(data) ? product : product[0]));
		return this;
	}

	addPost(data = {}) {
		if (!((data && typeof data === 'object' && !Array.isArray(data)) ||
			(Array.isArray(data) && data.every((item) => item && typeof item === 'object' && !Array.isArray(item))))) {
			throw new TypeError('Post items must be an object or an array of objects');
		}
		const posts = Array.isArray(data) ? data : [data];
		this._submessages.push({
			messageType: 2,
			messageText: '[ CANNOT_LOAD_POST - NIXEL ]',
		});
		const primitives = posts.map((p) => ({
			title: p.title ?? '',
			subtitle: p.subtitle ?? '',
			username: p.username ?? '',
			profile_picture_url: p.profile_picture_url ?? p.profile_url ?? '',
			is_verified: !!(p.is_verified || p.verified),
			thumbnail_url: p.thumbnail_url ?? p.thumbnail ?? '',
			post_caption: p.post_caption ?? p.caption ?? '',
			likes_count: p.likes_count ?? p.like ?? 0,
			comments_count: p.comments_count ?? p.comment ?? 0,
			shares_count: p.shares_count ?? p.share ?? 0,
			post_url: p.post_url ?? p.url ?? '',
			post_deeplink: p.post_deeplink ?? p.deeplink ?? '',
			source_app: p.source_app || p.source || 'INSTAGRAM',
			footer_label: p.footer_label ?? p.footer ?? '',
			footer_icon: p.footer_icon ?? p.icon ?? '',
			is_carousel: posts.length > 1,
			orientation: p.orientation ?? 'LANDSCAPE',
			post_type: p.post_type ?? 'VIDEO',
			__typename: 'GenAIPostPrimitive',
		}));
		this._sections.push(AIRich.newLayout('HScroll', primitives));
		return this;
	}

	addTip(text) {
		this._submessages.push({ messageType: 2, messageText: text });
		this._sections.push(
			AIRich.newLayout('Single', {
				text,
				__typename: 'GenAIMetadataTextPrimitive',
			})
		);
		return this;
	}

	addSuggest(suggestion) {
		if (!(typeof suggestion === 'string' || (Array.isArray(suggestion) && suggestion.every((v) => typeof v === 'string')))) {
			throw new TypeError('Suggestion must be a string or array of strings');
		}
		const suggest = Array.isArray(suggestion)
			? suggestion.map((text) => ({
					prompt_text: text,
					prompt_type: 'SUGGESTED_PROMPT',
					__typename: 'GenAIFollowUpSuggestionPillPrimitive',
				}))
			: [{
					prompt_text: suggestion,
					prompt_type: 'SUGGESTED_PROMPT',
					__typename: 'GenAIFollowUpSuggestionPillPrimitive',
				}];
		this._sections.push(AIRich.newLayout('ActionRow', suggest));
		return this;
	}

	build({ forwarded = true, includesUnifiedResponse = true, includesSubmessages = true, quoted, quotedParticipant } = {}) {
		const forward = forwarded ? {
			forwardingScore: 1,
			isForwarded: true,
			forwardedAiBotMessageInfo: { botJid: '0@bot' },
			forwardOrigin: 4,
		} : {};

		const qObj = quoted ? {
			stanzaId: quoted?.key?.id || quoted?.id,
			participant: quotedParticipant || quoted?.key?.participant || quoted?.key?.remoteJid,
			quotedType: 0,
			quotedMessage: typeof quoted === 'object' && quoted !== null ? (quoted.message ?? quoted) : undefined,
		} : {};

		const sections = this._footer
			? [...this._sections, AIRich.newLayout('Single', {
				text: this._footer,
				__typename: 'GenAIMetadataTextPrimitive',
			})]
			: [...this._sections];

		return {
			messageContextInfo: {
				deviceListMetadata: {},
				deviceListMetadataVersion: 2,
				botMetadata: {
					messageDisclaimerText: this._title,
					richResponseSourcesMetadata: { sources: this._richResponseSources },
				},
			},
			...this._extraPayload,
			botForwardedMessage: {
				message: {
					richResponseMessage: {
						messageType: 1,
						submessages: includesSubmessages ? this._submessages : [],
						unifiedResponse: {
							data: includesUnifiedResponse ? Buffer.from(JSON.stringify({ response_id: crypto.randomUUID(), sections })).toString('base64') : '',
						},
						contextInfo: {
							...forward,
							...qObj,
							...this._contextInfo,
						},
					},
				},
			},
		};
	}

	async send(jid, { forwarded, includesUnifiedResponse, includesSubmessages, ...options } = {}) {
		const msg = this.build({ forwarded, includesUnifiedResponse, includesSubmessages, ...options });
		return await this.#client.relayMessage(jid, msg, { ...options });
	}

	static tokenizer(code, lang = 'javascript') {
		const keywordsMap = {
			javascript: new Set([
				'break', 'case', 'catch', 'continue', 'debugger', 'delete', 'do', 'else',
				'finally', 'for', 'function', 'if', 'in', 'instanceof', 'new', 'return',
				'switch', 'this', 'throw', 'try', 'typeof', 'var', 'void', 'while', 'with',
				'true', 'false', 'null', 'undefined', 'class', 'const', 'let', 'super',
				'extends', 'export', 'import', 'yield', 'static', 'constructor', 'async',
				'await', 'get', 'set'
			]),
		};
		const TYPE_MAP = { 0: 'DEFAULT', 1: 'KEYWORD', 2: 'METHOD', 3: 'STR', 4: 'NUMBER', 5: 'COMMENT' };
		const keywords = keywordsMap[lang] || new Set();
		const tokens = [];
		let i = 0;
		const push = (content, type) => {
			if (!content) return;
			const last = tokens[tokens.length - 1];
			if (last && last.highlightType === type) last.codeContent += content;
			else tokens.push({ codeContent: content, highlightType: type });
		};
		while (i < code.length) {
			const c = code[i];
			if (/\s/.test(c)) {
				let s = i;
				while (i < code.length && /\s/.test(code[i])) i++;
				push(code.slice(s, i), 0);
				continue;
			}
			if (c === '/' && code[i + 1] === '/') {
				let s = i;
				i += 2;
				while (i < code.length && code[i] !== '\n') i++;
				push(code.slice(s, i), 5);
				continue;
			}
			if (c === '"' || c === "'" || c === '`') {
				let s = i;
				const q = c;
				i++;
				while (i < code.length) {
					if (code[i] === '\\' && i + 1 < code.length) i += 2;
					else if (code[i] === q) { i++; break; }
					else i++;
				}
				push(code.slice(s, i), 3);
				continue;
			}
			if (/[0-9]/.test(c)) {
				let s = i;
				while (i < code.length && /[0-9.]/.test(code[i])) i++;
				push(code.slice(s, i), 4);
				continue;
			}
			if (/[a-zA-Z_$]/.test(c)) {
				let s = i;
				while (i < code.length && /[a-zA-Z0-9_$]/.test(code[i])) i++;
				const word = code.slice(s, i);
				let type = 0;
				if (keywords.has(word)) type = 1;
				else {
					let j = i;
					while (j < code.length && /\s/.test(code[j])) j++;
					if (code[j] === '(') type = 2;
				}
				push(word, type);
				continue;
			}
			push(c, 0);
			i++;
		}
		return {
			codeBlock: tokens,
			unified_codeBlock: tokens.map((t) => ({
				content: t.codeContent,
				type: TYPE_MAP[t.highlightType],
			})),
		};
	}

	static toTableMetadata(arr) {
		if (!Array.isArray(arr) || !arr.every((row) => Array.isArray(row) && row.every((cell) => typeof cell === 'string'))) {
			throw new TypeError('Table must be a nested array of strings');
		}
		const [header, ...rows] = arr;
		const maxLen = Math.max(header.length, ...rows.map((r) => r.length));
		const normalize = (r) => [...r, ...Array(maxLen - r.length).fill('')];
		const unified_rows = [
			{ is_header: true, cells: normalize(header) },
			...rows.map((r) => ({ is_header: false, cells: normalize(r) }))
		];
		const rowsMeta = unified_rows.map((r) => ({
			items: r.cells,
			...(r.is_header ? { isHeading: true } : {}),
		}));
		return {
			title: '',
			rows: rowsMeta,
			unified_rows,
		};
	}
}

class imup {
    constructor(utils, waUploadToServer, relayMessageFn, authState) {
        this.utils = utils;
        this.relayMessage = relayMessageFn
        this.waUploadToServer = waUploadToServer;
        this.authState = authState;
    }

    detectType(content) {
    if (content.requestPaymentMessage) return 'PAYMENT';
    if (content.productMessage) return 'PRODUCT';
    if (content.interactiveMessage) return 'INTERACTIVE';
    if (content.albumMessage) return 'ALBUM';
    if (content.eventMessage) return 'EVENT';
    if (content.pollResultMessage) return 'POLL_RESULT';
    if (content.orderMessage) return 'ORDER';
    if (content.groupStatus) return 'GROUP_STATUS';
    if (content.groupLabel) return 'GROUP_LABEL';
    if (content.richMessage) return 'RICH_MESSAGE';
    if (content.carouselMessage) return 'CAROUSEL_MESSAGE';
    return null;
}

    async handlePayment(content, quoted) {
        const data = content.requestPaymentMessage;
        let notes = {};

        if (data.sticker?.stickerMessage) {
            notes = {
                stickerMessage: {
                    ...data.sticker.stickerMessage,
                    contextInfo: {
                        stanzaId: quoted?.key?.id,
                        participant: quoted?.key?.participant || content.sender,
                        quotedMessage: quoted?.message
                    }
                }
            };
        } else if (data.note) {
            notes = {
                extendedTextMessage: {
                    text: data.note,
                    contextInfo: {
                        stanzaId: quoted?.key?.id,
                        participant: quoted?.key?.participant || content.sender,
                        quotedMessage: quoted?.message
                    }
                }
            };
        }

        return {
            requestPaymentMessage: WAProto.Message.RequestPaymentMessage.fromObject({
                expiryTimestamp: data.expiry || 0,
                amount1000: data.amount || 0,
                currencyCodeIso4217: data.currency || "IDR",
                requestFrom: data.from || "0@s.whatsapp.net",
                noteMessage: notes,
                background: data.background ?? {
                    id: "DEFAULT",
                    placeholderArgb: 0xFFF0F0F0
                }
            })
        };
    }
        
    async handleProduct(content, jid, quoted) {
        const {
            title, 
            description, 
            thumbnail,
            productId, 
            retailerId, 
            url, 
            body = "", 
            footer = "", 
            buttons = [],
            priceAmount1000 = null,
            currencyCode = "IDR"
        } = content.productMessage;

        let productImage;

        if (Buffer.isBuffer(thumbnail)) {
            const { imageMessage } = await this.utils.generateWAMessageContent(
                { image: thumbnail }, 
                { upload: this.waUploadToServer }
            );
            productImage = imageMessage;
        } else if (typeof thumbnail === 'object' && thumbnail.url) {
            const { imageMessage } = await this.utils.generateWAMessageContent(
                { image: { url: thumbnail.url }}, 
                { upload: this.waUploadToServer }
            );
            productImage = imageMessage;
        }

        return {
            viewOnceMessage: {
                message: {
                    interactiveMessage: {
                        body: { text: body },
                        footer: { text: footer },
                        header: {
                            title,
                            hasMediaAttachment: true,
                            productMessage: {
                                product: {
                                    productImage,
                                    productId,
                                    title,
                                    description,
                                    currencyCode,
                                    priceAmount1000,
                                    retailerId,
                                    url,
                                    productImageCount: 1
                                },
                                businessOwnerJid: "0@s.whatsapp.net"
                            }
                        },
                        nativeFlowMessage: { buttons }
                    }
                }
            }
        };
    }
        
async handleInteractive(content, jid, quoted) {
    const {
        text = "",
        footer = "",
        title = "",
        buttons = [],
        image,
        video,
        contextInfo = {},
        externalAdReply
    } = content.interactiveMessage;
    
    const hasReviewAndPay = buttons.some(btn => btn.type === 'review_and_pay' || btn.name === 'review_and_pay');
    
    if (hasReviewAndPay) {
        const reviewBtn = buttons.find(btn => btn.type === 'review_and_pay' || btn.name === 'review_and_pay');
        const thumb = image || video;
        
        return {
            interactiveMessage: {
                header: {
                    hasMediaAttachment: true,
                    jpegThumbnail: thumb
                },
                body: { text: text },
                footer: { text: footer },
                nativeFlowMessage: {
                    buttons: [
                        {
                            name: "review_and_pay",
                            buttonParamsJson: JSON.stringify({
                                currency: reviewBtn.currency || "IDR",
                                payment_configuration: reviewBtn.payment_configuration || "",
                                payment_type: reviewBtn.payment_type || "",
                                transaction_id: reviewBtn.transaction_id || "",
                                total_amount: reviewBtn.total_amount || { value: 20000000, offset: 100 },
                                reference_id: reviewBtn.reference_id || "wxx",
                                order_request_id: reviewBtn.order_request_id || "2063637e-5a38-446d-a25c-97bb68dfce02",
                                type: reviewBtn.type || "digital-goods",
                                payment_method: reviewBtn.payment_method || "",
                                payment_status: reviewBtn.payment_status || "captured",
                                payment_timestamp: reviewBtn.payment_timestamp || 1779974803,
                                order: reviewBtn.order || {
                                    status: "shipped",
                                    description: "",
                                    subtotal: { value: 20000000, offset: 100 },
                                    tax: { value: 8, offset: 100 },
                                    discount: { value: 6400, offset: 100 },
                                    shipping: { value: 4, offset: 100 },
                                    order_type: "ORDER",
                                    items: [{
                                        retailer_id: "778739a4-e7b1-4295-9f29-ed3daec92a95",
                                        name: reviewBtn.item_name || "putyh",
                                        amount: { value: 900000, offset: 100 },
                                        quantity: 0
                                    }]
                                },
                                additional_note: reviewBtn.name || "whyuxD",
                                native_payment_methods: reviewBtn.native_payment_methods || ['{"name":"PIX","enabled":false}'],
                                share_payment_status: reviewBtn.share_payment_status !== false,
                                is_soft_deleted: reviewBtn.is_soft_deleted || false
                            })
                        }
                    ]
                },
                contextInfo: {
                    mentionedJid: contextInfo.mentionedJid || [],
                    ...contextInfo
                }
            }
        };
    }
    
    const processedButtons = buttons.map((btn) => {
        if (btn.name && btn.buttonParamsJson) return btn;
        
        switch (btn.type) {
            case 'reply':
                return {
                    name: "quick_reply",
                    buttonParamsJson: JSON.stringify({ display_text: btn.text, id: btn.id })
                };
            case 'url':
                return {
                    name: "cta_url",
                    buttonParamsJson: JSON.stringify({ 
                        display_text: btn.text, 
                        url: btn.url, 
                        webview_interaction: btn.webview || btn.webview_interaction || false 
                    })
                };
            case 'call':
                return {
                    name: "cta_call",
                    buttonParamsJson: JSON.stringify({ display_text: btn.text, id: btn.id })
                };
            case 'copy':
                return {
                    name: "cta_copy",
                    buttonParamsJson: JSON.stringify({ display_text: btn.text, copy_code: btn.copy_code, id: btn.id })
                };
            case 'location':
                return { name: "send_location", buttonParamsJson: "{}" };
            case 'reminder':
                return {
                    name: "cta_reminder",
                    buttonParamsJson: JSON.stringify({ display_text: btn.text, id: btn.id })
                };
            case 'cancel_reminder':
                return {
                    name: "cta_cancel_reminder",
                    buttonParamsJson: JSON.stringify({ display_text: btn.text, id: btn.id })
                };
            case 'address':
                return {
                    name: "address_message",
                    buttonParamsJson: JSON.stringify({ display_text: btn.text, id: btn.id })
                };
            case 'selection':
                const selectionParams = { title: btn.title, sections: btn.sections || [] };
                if (btn.icon) selectionParams.icon = btn.icon;
                return {
                    name: "single_select",
                    buttonParamsJson: JSON.stringify(selectionParams)
                };
            case 'catalog_greeting':
                return {
                    name: "automated_greeting_message_view_catalog",
                    buttonParamsJson: JSON.stringify({
                        business_phone_number: btn.business_phone_number,
                        catalog_product_id: btn.catalog_product_id
                    })
                };
            case 'cta_catalog':
                return {
                    name: "cta_catalog",
                    buttonParamsJson: JSON.stringify({
                        business_phone_number: btn.business_phone_number,
                        catalog_product_id: btn.catalog_product_id
                    })
                };
            default:
                return {
                    name: "quick_reply",
                    buttonParamsJson: JSON.stringify({ display_text: btn.text || "Button", id: btn.id || `id_${Date.now()}` })
                };
        }
    });
    
    let header = { title: title || "", hasMediaAttachment: false };
    if (image || video) {
        let mediaContent = image ? { image: image } : { video: video };
        
        if (typeof image === 'string') mediaContent = { image: { url: image } };
        if (typeof video === 'string') mediaContent = { video: { url: video } };
        
        try {
            const media = await this.utils.prepareWAMessageMedia(mediaContent, { upload: this.waUploadToServer });
            header = { title: title || "", hasMediaAttachment: true, ...media };
        } catch (error) {
            console.error("Error preparing media:", error);
        }
    }
    
    const interactiveMessage = {
        body: { text: text || "" },
        footer: { text: footer || "" },
        header: header,
        nativeFlowMessage: { buttons: processedButtons },
        contextInfo: {
            mentionedJid: contextInfo.mentionedJid || [],
            ...contextInfo
        }
    };
    
    if (externalAdReply) {
        interactiveMessage.contextInfo.externalAdReply = {
            title: externalAdReply.title || "",
            body: externalAdReply.body || "",
            mediaType: externalAdReply.mediaType || 1,
            thumbnailUrl: externalAdReply.thumbnailUrl || "",
            mediaUrl: externalAdReply.mediaUrl || "",
            sourceUrl: externalAdReply.sourceUrl || "",
            showAdAttribution: externalAdReply.showAdAttribution || false,
            renderLargerThumbnail: externalAdReply.renderLargerThumbnail || false,
            ...externalAdReply
        };
    }
    
    return {
        interactiveMessage: interactiveMessage
    };
}
        
    async handleAlbum(content, jid, quoted) {
        const array = content.albumMessage;
        const album = await this.utils.generateWAMessageFromContent(jid, {
            messageContextInfo: {
                messageSecret: crypto.randomBytes(32),
            },
            albumMessage: {
                expectedImageCount: array.filter((a) => a.hasOwnProperty("image")).length,
                expectedVideoCount: array.filter((a) => a.hasOwnProperty("video")).length,
            },
        }, {
            userJid: this.utils.generateMessageID().split('@')[0] + '@s.whatsapp.net',
            quoted,
            upload: this.waUploadToServer
        });
        
        await this.relayMessage(jid, album.message, {
            messageId: album.key.id,
        });
        
        for (let content of array) {
            const img = await this.utils.generateWAMessage(jid, content, {
                upload: this.waUploadToServer,
            });
            
            img.message.messageContextInfo = {
                messageSecret: crypto.randomBytes(32),
                messageAssociation: {
                    associationType: 1,
                    parentMessageKey: album.key,
                },    
                participant: "0@s.whatsapp.net",
                remoteJid: "status@broadcast",
                forwardingScore: 99999,
                isForwarded: true,
                mentionedJid: [jid],
                starred: true,
                labels: ["Y", "Important"],
                isHighlighted: true,
                businessMessageForwardInfo: {
                    businessOwnerJid: jid,
                },
                dataSharingContext: {
                    showMmDisclosure: true,
                },
            };

            img.message.forwardedNewsletterMessageInfo = {
                newsletterJid: "120363422469819028@newsletter",
                serverMessageId: 1,
                newsletterName: `R-Baileys | Updates Info`,
                contentType: 1,
                timestamp: new Date().toISOString(),
                senderName: "R-Baileys",
                contentType: "UPDATE_CARD",
                priority: "high",
                status: "sent",
            };
            
            img.message.disappearingMode = {
                initiator: 3,
                trigger: 4,
                initiatorDeviceJid: jid,
                initiatedByExternalService: true,
                initiatedByUserDevice: true,
                initiatedBySystem: true,      
                initiatedByServer: true,
                initiatedByAdmin: true,
                initiatedByUser: true,
                initiatedByApp: true,
                initiatedByBot: true,
                initiatedByMe: true,
            };

            await this.relayMessage(jid, img.message, {
                messageId: img.key.id,
                quoted: {
                    key: {
                        remoteJid: album.key.remoteJid,
                        id: album.key.id,
                        fromMe: true,
                        participant: this.utils.generateMessageID().split('@')[0] + '@s.whatsapp.net',
                    },
                    message: album.message,
                },
            });
        }
        return album;
    }   

    async handleEvent(content, jid, quoted) {
        const eventData = content.eventMessage;
        
        const msg = await this.utils.generateWAMessageFromContent(jid, {
            viewOnceMessage: {
                message: {
                    messageContextInfo: {
                        deviceListMetadata: {},
                        deviceListMetadataVersion: 2,
                        messageSecret: crypto.randomBytes(32),
                        supportPayload: JSON.stringify({
                            version: 2,
                            is_ai_message: true,
                            should_show_system_message: true,
                            ticket_id: crypto.randomBytes(16).toString('hex')
                        })
                    },
                    eventMessage: {
                        contextInfo: {
                            mentionedJid: [jid],
                            participant: jid,
                            remoteJid: "status@broadcast",
                            forwardedNewsletterMessageInfo: {
                                newsletterName: "R-Baileys | Updates Info",
                                newsletterJid: "120363422469819028@newsletter",
                                serverMessageId: 1
                            }
                        },
                        isCanceled: eventData.isCanceled || false,
                        name: eventData.name,
                        description: eventData.description,
                        location: eventData.location || {
                            degreesLatitude: 0,
                            degreesLongitude: 0,
                            name: "Location"
                        },
                        joinLink: eventData.joinLink || '',
                        startTime: typeof eventData.startTime === 'string' ? parseInt(eventData.startTime) : eventData.startTime || Date.now(),
                        endTime: typeof eventData.endTime === 'string' ? parseInt(eventData.endTime) : eventData.endTime || Date.now() + 3600000,
                        extraGuestsAllowed: eventData.extraGuestsAllowed !== false
                    }
                }
            }
        }, { quoted });
        
        await this.relayMessage(jid, msg.message, {
            messageId: msg.key.id
        });
        return msg;
    }
        
    async handlePollResult(content, jid, quoted) {
        const pollData = content.pollResultMessage;
        const msg = await this.utils.generateWAMessageFromContent(jid, {
            pollResultSnapshotMessage: {
                name: pollData.name,
                pollVotes: pollData.pollVotes.map(vote => ({
                    optionName: vote.optionName,
                    optionVoteCount: typeof vote.optionVoteCount === 'number' 
                    ? vote.optionVoteCount.toString() 
                    : vote.optionVoteCount
                })),
                contextInfo: {
                    isForwarded: true,
                    forwardingScore: 1,
                    forwardedNewsletterMessageInfo: {
                        newsletterName: pollData.newsletter?.newsletterName || "120363422469819028@newsletter",
                        newsletterJid: pollData.newsletter?.newsletterJid || "R-Baileys | Updates Info",
                        serverMessageId: 1000,
                        contentType: "UPDATE"
                    }
                }
            }
        }, {
            userJid: this.utils.generateMessageID().split('@')[0] + '@s.whatsapp.net',
            quoted
        });
    
        await this.relayMessage(jid, msg.message, {
            messageId: msg.key.id
        });
   
        return msg;
    }
        
    async handleOrderMessage(content, jid, quoted) {
        const orderData = content.orderMessage;
        
        const Haha = await this.utils.generateWAMessageFromContent(jid, {
            orderMessage: {
                orderId: "RB4IL3YS09",
                thumbnail: orderData.thumbnail || null,
                itemCount: orderData.itemCount || 0,
                status: "ACCEPTED",
                surface: "CATALOG",
                message: orderData.message,
                orderTitle: orderData.orderTitle,
                sellerJid: "0@whatsapp.net",
                token: "R-B4IL3YS_EXAMPLE_TOKEN",
                totalAmount1000: orderData.totalAmount1000 || 0,
                totalCurrencyCode: orderData.totalCurrencyCode || "IDR",
                messageVersion: 2
            }
        }, { quoted: quoted });

        await this.relayMessage(jid, Haha.message, {});
        return Haha;
    }
        
    async handleGroupStory(content, jid, quoted) {
        const storyData = content.groupStatus;
        let messageContent;
    
        if (storyData.message) {
            messageContent = storyData;
        } else {
            if (typeof this.utils?.generateWAMessageContent === "function") {
                messageContent = await this.utils.generateWAMessageContent(storyData, {
                    upload: this.waUploadToServer
                });
            } else {
                messageContent = await Utils_1.generateWAMessageContent(storyData, {
                    upload: this.waUploadToServer
                });
            }
        }

        let msg = {
            message: {
                groupStatusMessageV2: {
                    message: messageContent.message || messageContent
                }
            }
        };

        return await this.relayMessage(jid, msg.message, {
            messageId: this.utils.generateMessageID()
        });
    }

    async handleGbLabel(content, jid) {
        const x = content.groupLabel;
        if (!jid.endsWith('@g.us')) {
            throw new Error('group required!')
        }
        
        const msg = this.utils.generateWAMessageFromContent(jid, {
            protocolMessage: {
                type: "GROUP_MEMBER_LABEL_CHANGE", 
                memberLabel: {
                    label: x.labelText.slice(0, 30)
                }
            }
        }, {});
        await this.relayMessage(jid, msg.message, {
            additionalNodes: [
                {
                    tag: 'meta', 
                    attrs: {
                        tag_reason: 'user_update', 
                        appdata: 'member_tag'
                    }, 
                    content: undefined
                }
            ]
        }) 
    }

async handleCarouselMessage(content, jid, quoted) {
    const carouselData = content.carouselMessage;
    
    const transformButtons = (buttons) => {
        return buttons.map(btn => {
            let name = 'quick_reply';
            let params = {};
            
            if (btn.type === 'quick_reply' || btn.type === 'reply') {
                name = 'quick_reply';
                params = {
                    display_text: btn.displayText || btn.display_text || btn.text || 'Button',
                    id: btn.id || `id_${Date.now()}`
                };
            } else if (btn.type === 'cta_url' || btn.type === 'url') {
                name = 'cta_url';
                params = {
                    display_text: btn.displayText || btn.display_text || btn.text || 'Visit',
                    url: btn.url
                };
            } else if (btn.type === 'cta_copy' || btn.type === 'copy') {
                name = 'cta_copy';
                params = {
                    display_text: btn.displayText || btn.display_text || btn.text || 'Copy',
                    copy_code: btn.copy_code || btn.copyCode || btn.code
                };
            } else if (btn.type === 'cta_call' || btn.type === 'call') {
                name = 'cta_call';
                params = {
                    display_text: btn.displayText || btn.display_text || btn.text || 'Call',
                    phone_number: btn.phone_number || btn.phoneNumber
                };
            } else if (btn.type === 'single_select' || btn.type === 'selection') {
                name = 'single_select';
                params = {
                    title: btn.title || 'Select',
                    sections: btn.sections || []
                };
            } else if (btn.type === 'send_location' || btn.type === 'location') {
                name = 'send_location';
                params = {};
            }
            
            return {
                name: name,
                buttonParamsJson: JSON.stringify(params)
            };
        });
    };
    
    const cards = await Promise.all((carouselData.cards || []).map(async (card) => {
        let header = {};
        
        if (card.image) {
            const media = await this.utils.prepareWAMessageMedia(
                { image: card.image },
                { upload: this.waUploadToServer }
            );
            header = { hasMediaAttachment: true, ...media };
        } else if (card.video) {
            const media = await this.utils.prepareWAMessageMedia(
                { video: card.video },
                { upload: this.waUploadToServer }
            );
            header = { hasMediaAttachment: true, ...media };
        } else if (card.imageMessage) {
            header = { hasMediaAttachment: true, imageMessage: card.imageMessage };
        } else if (card.videoMessage) {
            header = { hasMediaAttachment: true, videoMessage: card.videoMessage };
        } else {
            header = { hasMediaAttachment: false };
        }
        
        if (card.title && !header.title) header.title = card.title;
        if (card.subtitle) header.subtitle = card.subtitle;
        
        return {
            header: header,
            body: { text: card.body || card.text || '' },
            footer: card.footer ? { text: card.footer } : undefined,
            nativeFlowMessage: {
                messageVersion: card.messageVersion || 1,
                buttons: transformButtons(card.buttons || card.interactiveButtons || [])
            }
        };
    }));
    
    const carouselCardType = carouselData.carouselCardType !== undefined 
        ? carouselData.carouselCardType 
        : 0;
    
    return {
        interactiveMessage: {
            body: { text: carouselData.body?.text || carouselData.text || '' },
            footer: carouselData.footer ? { text: carouselData.footer } : undefined,
            carouselMessage: {
                messageVersion: carouselData.messageVersion || 1,
                carouselCardType: carouselCardType,
                cards: cards
            },
            contextInfo: carouselData.contextInfo || {}
        }
    };
}

    async handleRichMessage(content, jid, quoted) {
        const richData = content.richMessage;
        const aiRich = new AIRich(this);
        
        if (richData.title) aiRich.setTitle(richData.title);
        if (richData.subtitle) aiRich.setSubtitle(richData.subtitle);
        if (richData.body) aiRich.setBody(richData.body);
        if (richData.footer) aiRich.setFooter(richData.footer);
        if (richData.contextInfo) aiRich.setContextInfo(richData.contextInfo);
        
        if (richData.text) aiRich.addText(richData.text, richData.textOptions);
        if (richData.code) aiRich.addCode(richData.code.language, richData.code.content);
        if (richData.table) aiRich.addTable(richData.table);
        if (richData.sources) aiRich.addSource(richData.sources);
        if (richData.reels) aiRich.addReels(richData.reels);
        if (richData.images) aiRich.addImage(richData.images);
        if (richData.videos) aiRich.addVideo(richData.videos);
        if (richData.products) aiRich.addProduct(richData.products);
        if (richData.posts) aiRich.addPost(richData.posts);
        if (richData.tip) aiRich.addTip(richData.tip);
        if (richData.suggestions) aiRich.addSuggest(richData.suggestions);
        
        return await aiRich.send(jid, {
            forwarded: richData.forwarded !== false,
            includesUnifiedResponse: richData.includesUnifiedResponse !== false,
            includesSubmessages: richData.includesSubmessages !== false,
            quoted: quoted
        });
    }
}

module.exports = imup;