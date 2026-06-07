"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});

const fetch = require("node-fetch");
const axios = require('axios');
const cheerio = require('cheerio');
const { XMLParser } = require('fast-xml-parser');
const qs = require('qs');

const getDownloadLinks = url => {
    return new Promise(async (resolve, reject) => {
        try {
            const response = await axios.post("https://snapsave.app/action.php?lang=id", "url=" + url, {
                headers: {
                    accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
                    "content-type": "application/x-www-form-urlencoded",
                    origin: "https://snapsave.app",
                    referer: "https://snapsave.app/id",
                    "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.0.0 Safari/537.36"
                }
            })

            const decodeData = (data) => {
                let [p1, p2, p3, p4, p5, p6] = data
                const decodeSegment = (s, b, l) => {
                    const c = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ+/".split("")
                    let bs = c.slice(0, b), ds = c.slice(0, l)
                    let dv = s.split("").reverse().reduce((a, ch, i) => bs.indexOf(ch) !== -1 ? a += bs.indexOf(ch) * Math.pow(b, i) : a, 0)
                    let res = ""
                    while (dv > 0) { res = ds[dv % l] + res; dv = Math.floor(dv / l) }
                    return res || "0"
                }
                p6 = ""
                for (let i = 0; i < p1.length; i++) {
                    let s = ""
                    while (p1[i] !== p3[p5]) { s += p1[i]; i++ }
                    for (let j = 0; j < p3.length; j++) s = s.replace(new RegExp(p3[j], "g"), j.toString())
                    p6 += String.fromCharCode(decodeSegment(s, p5, 10) - p4)
                }
                return decodeURIComponent(encodeURIComponent(p6))
            }

            const extractParams = (d) => d.split("decodeURIComponent(escape(r))}(")[1].split("))")[0].split(",").map(i => i.replace(/"/g, "").trim())
            const extractDownloadUrl = (d) => d.split("getElementById(\"download-section\").innerHTML = \"")[1].split("\"; document.getElementById(\"inputData\").remove(); ")[0].replace(/\\(.)/g, "$1")
            
            const videoPageContent = extractDownloadUrl(decodeData(extractParams(response.data)))
            const $ = cheerio.load(videoPageContent)
            const downloadLinks = []
            let thumbnail = null

            $("div.download-items__btn").each((i, btn) => {
                let dUrl = $(btn).find("a").attr("href")
                if (dUrl) {
                    if (!/https?:\/\//.test(dUrl)) dUrl = "https://snapsave.app" + dUrl
                    downloadLinks.push(dUrl)
                }
            })

            $("div.download-items__thumb img").each((i, img) => {
                if (!thumbnail) thumbnail = $(img).attr("src")
            })
            
            resolve({ 
                url: downloadLinks, 
                thumbnail: thumbnail,
                metadata: { 
                    url: url,
                    source: "snapsave.app"
                } 
            })
        } catch (e) { 
            reject(e) 
        }
    })
}

async function Instagram(url) {
    try {
        const snapResult = await getDownloadLinks(url);
        const snapVideoUrl = snapResult.url[0];
        const snapThumbnail = snapResult.thumbnail;

        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
                'cache-control': 'max-age=0',
                'dpr': '2',
                'viewport-width': '980',
                'sec-ch-ua': '"Chromium";v="136", "Google Chrome";v="136", "Not.A/Brand";v="99"',
                'sec-ch-ua-mobile': '?1',
                'sec-ch-ua-platform': '"Android"',
                'sec-ch-ua-platform-version': '"15.0.0"',
                'sec-ch-ua-model': '"25028RN03A"',
                'sec-ch-ua-full-version-list': '"Chromium";v="136.0.7103.125", "Google Chrome";v="136.0.7103.125", "Not.A/Brand";v="99.0.0.0"',
                'sec-ch-prefers-color-scheme': 'light',
                'dnt': '1',
                'upgrade-insecure-requests': '1',
                'sec-fetch-site': 'same-origin',
                'sec-fetch-mode': 'navigate',
                'sec-fetch-user': '?1',
                'sec-fetch-dest': 'document',
                'accept-language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
                'priority': 'u=0, i',
                'timeout': 10000
            }
        });

        const $ = cheerio.load(response.data);
        let scriptJson = null;

        $('script[type="application/json"]').each((_, el) => {
            const content = $(el).html();
            if (content && content.includes('xdt_api__v1__media__shortcode__web_info')) {
                try {
                    scriptJson = JSON.parse(content);
                } catch (parseError) {
                    console.error('JSON Parse Error:', parseError.message);
                }
            }
        });

        if (!scriptJson) {
            throw new Error('Data script tidak ditemukan (Mungkin IP Blocked atau URL salah).');
        }

        const item = scriptJson.require?.[0]?.[3]?.[0]?.__bbox?.require?.[0]?.[3]?.[1]?.__bbox?.result?.data?.xdt_api__v1__media__shortcode__web_info?.items?.[0];

        if (!item) {
            throw new Error('Struct item tidak ditemukan dalam JSON.');
        }

        const isVideo = item.video_dash_manifest || (item.video_versions && item.video_versions.length > 0);
        const isSlide = item.carousel_media || (item.image_versions2 && !isVideo);

        let finalResult = {};

        if (isVideo && !isSlide) {
            const dashXml = item.video_dash_manifest;
            const parser = new XMLParser({ ignoreAttributes: false });
            let audioTracks = [];
            
            try {
                const manifest = parser.parse(dashXml);
                const period = manifest?.MPD?.Period;
                if (period) {
                    const adaptationSets = Array.isArray(period.AdaptationSet) ? period.AdaptationSet : [period.AdaptationSet];
                    adaptationSets.forEach((set) => {
                        if (!set) return;
                        if (set['@_contentType'] === 'audio') {
                            const representations = Array.isArray(set.Representation) ? set.Representation : [set.Representation];
                            representations.forEach((rep) => {
                                if (rep?.BaseURL) {
                                    audioTracks.push({
                                        url: rep.BaseURL,
                                        bandwidth: parseInt(rep['@_bandwidth']) || 0,
                                        codecs: rep['@_codecs'] || '',
                                        mimeType: rep['@_mimeType'] || '',
                                    });
                                }
                            });
                        }
                    });
                }
            } catch (e) {
                console.error('XML Parse error:', e.message);
            }

            finalResult = {
                type: 'video',
                metadata: {
                    id: item.id,
                    code: item.code,
                    caption: item.caption?.text || '',
                    createTime: new Date(item.taken_at * 1000).toLocaleString(),
                },
                author: {
                    id: item.user?.pk,
                    username: item.user?.username || 'N/A',
                    fullName: item.user?.full_name || '',
                    profilePic: item.user?.hd_profile_pic_url_info?.url || '',
                    verified: item.user?.is_verified
                },
                media: {
                    thumbnail: snapThumbnail || null,
                    video: snapVideoUrl || null,
                    audios: audioTracks
                }
            };

        } else if (isSlide) {
            let slides = [];

            if (item.carousel_media && item.carousel_media.length > 0) {
                slides = item.carousel_media.map((slideItem, index) => {
                    return {
                        slide_id: slideItem.id,
                        index: index + 1,
                        images: (slideItem.image_versions2?.candidates || []).map(img => ({
                            url: img.url,
                            resolution: `${img.width}x${img.height}`
                        })),
                        videos: slideItem.video_versions ? slideItem.video_versions.map(v => ({
                            url: v.url,
                            resolution: `${v.width}x${v.height}`,
                            type: v.type || 'video/mp4'
                        })) : []
                    };
                });
            } else if (item.image_versions2) {
                slides.push({
                    slide_id: item.id,
                    index: 1,
                    images: (item.image_versions2?.candidates || []).map(img => ({
                        url: img.url,
                        resolution: `${img.width}x${img.height}`
                    })),
                    videos: []
                });
            } else {
                throw new Error('Tidak ada media gambar/slide yang ditemukan pada post ini.');
            }

            finalResult = {
                type: 'slide',
                metadata: {
                    id: item.id,
                    code: item.code,
                    caption: item.caption?.text || '',
                    createTime: new Date(item.taken_at * 1000).toLocaleString(),
                },
                author: {
                    id: item.user?.pk,
                    username: item.user?.username || 'N/A',
                    fullName: item.user?.full_name || '',
                    profilePic: item.user?.hd_profile_pic_url_info?.url || '',
                    verified: item.user?.is_verified
                },
                media: {
                    total_slides: slides.length,
                    slides: slides
                }
            };

        } else {
            throw new Error('Tidak dapat menentukan tipe media (video/slide).');
        }

        return {
            status: true,
            result: finalResult
        };

    } catch (error) {
        return {
            status: false,
            error: error.message
        };
    }
}

exports.Instagram = Instagram;