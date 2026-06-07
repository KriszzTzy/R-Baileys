"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});

const fetch = require("node-fetch");
const axios = require("axios");
const cheerio = require("cheerio");

async function pindl(url) {
    try {
        const res = await axios.get(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Linux; Android 12; SAMSUNG SM-S908B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/17.0 Chrome/96.0.4664.104 Mobile Safari/537.36",
                "Accept-Language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7"
            },
            timeout: 15000
        });

        const $ = cheerio.load(res.data);

        const imageSnippet = $('script[data-test-id="leaf-snippet"]').text();
        const videoSnippet = $('script[data-test-id="video-snippet"]').text();

        if (!imageSnippet) throw new Error("Media tidak ditemukan");

        const imageJson = JSON.parse(imageSnippet);
        const videoJson = videoSnippet ? JSON.parse(videoSnippet) : null;
        
        let title = imageJson.name || imageJson.headline || 'Pinterest Media';
        
        let thumbnail = null;
        if (imageJson.image) {
            thumbnail = typeof imageJson.image === 'string' ? imageJson.image : imageJson.image.url;
        }
        
        let description = imageJson.description || null;

        return {
            status: true,
            isVideo: !!videoJson,
            title: title,
            thumbnail: thumbnail,
            description: description,
            imageUrl: imageJson.image || null,
            videoUrl: videoJson?.contentUrl || null,
            uploadDate: videoJson?.uploadDate || imageJson?.datePublished || null,
            author: videoJson?.author || imageJson?.author || null
        };
    } catch (e) {
        return {
            status: false,
            message: "failed download",
            error: e.message
        };
    }
}

exports.pindl = pindl;