"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});

const fetch = require("node-fetch");

async function TikTok(url) {
    try {
        const html = await fetch(url, {
            headers: {
                authority: "www.tiktok.com",
                "sec-ch-ua-mobile": "?1",
                "sec-ch-ua-platform": `"Android"`,
                "user-agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36"
            }
        }).then(a => a.text());
        
        const match = html.match(/<script id="__UNIVERSAL_DATA_FOR_REHYDRATION__"[^>]*>([\s\S]*?)<\/script>/);
        if (!match) throw new Error("Gagal extract data TikTok");
        
        const json = JSON.parse(match[1]);
        const data = json.__DEFAULT_SCOPE__["webapp.reflow.video.detail"].itemInfo.itemStruct;
        let download = null;
        let videoUrlNoWatermark = null;
        
        if (data.imagePost) {
            download = data.imagePost.images.map(img => ({
                url: img.imageURL.urlList[0],
                width: img.imageURL.width,
                height: img.imageURL.height
            }));
        } else {
            try {
                const apiRes = await fetch(`https://www.tiktok.com/player/api/v1/items?item_ids=${data.id}`);
                const apiJson = await apiRes.json();
                if (apiJson.items?.[0]?.video_info?.url_list?.[0]) {
                    download = apiJson.items[0].video_info.url_list[0];
                    videoUrlNoWatermark = apiJson.items[0].video_info.url_list.find(url => !url.includes('watermark')) || download;
                }
            } catch (err) {
                download = data.video?.downloadAddr || data.video?.playAddr || null;
                videoUrlNoWatermark = data.video?.playAddr || download;
            }
        }

        const hashtags = data.challenges?.map(tag => ({
            id: tag.id,
            name: tag.title
        })) || [];

        const music = data.music ? {
            id: data.music.id,
            title: data.music.title || "Original Sound",
            author: data.music.authorName || data.author?.nickname || "Unknown",
            thumbnail: data.music.coverLarge || data.music.coverMedium || data.music.coverThumb,
            duration: data.music.duration,
            url: data.music.playUrl,
            isOriginalSound: !data.music.authorName
        } : null;

        return {
            creator: 'R-Baileys | Kristian.',
            id: data.id || data.aweme_id,
            isVideo: !data.imagePost,
            title: data.desc || data.suggestedWords?.[0] || "No Title",
            region: data.locationCreated || "Unknown",
            duration: data.duration || data.music?.duration || 0,
            createTime: new Date(data.createTime * 1000).toLocaleString(),
            createTimeRaw: data.createTime,
            hashtags: hashtags,
            effects: data.effects?.map(effect => ({
                id: effect.effectId,
                name: effect.effectName
            })) || [],
            download: download,
            noWatermark: videoUrlNoWatermark,
            isImagePost: !!data.imagePost,
            imageCount: data.imagePost?.images.length || 0,
            author: {
                id: data.author.id,
                avatar: data.author.avatarThumb || data.author.avatarMedium,
                avatarLarger: data.author.avatarLarger,
                nickname: data.author.nickname,
                username: data.author.uniqueId,
                signature: data.author.signature || "",
                followers: data.author.followerCount || 0,
                following: data.author.followingCount || 0,
                like: data.author.heartCount || 0,
                videoCount: data.author.videoCount || 0,
                verified: data.author.verified,
                isBusiness: data.author.isBusiness || false,
                privateAccount: data.author.privateAccount || false
            },
            stats: {
                like: data.stats.diggCount || 0,
                views: data.stats.playCount || data.play || 0,
                share: data.stats.shareCount || 0,
                comment: data.stats.commentCount || 0,
                saves: data.statsV2?.collectCount || data.stats?.collectCount || 0
            },
            music: music,
            privacy: {
                duetEnabled: data.duetEnabled || false,
                stitchEnabled: data.stitchEnabled || false,
                downloadEnabled: data.downloadEnabled || false,
                commentEnabled: data.commentEnabled || true
            }
        };
        
    } catch (error) {
        return { error: true, message: error.message, url: url };
    }
}

exports.TikTok = TikTok;