<img src="https://user-images.githubusercontent.com/74038190/212284100-561aa473-3905-4a80-b561-0d28506553ee.gif" width="100%">

<p align="center">
  Reze-Baileys A simple and powerful WebSocket library for WhatsApp automation.<br/>
  Fast, stable, and easy to use for real-time bots.
</p>

  <img src="https://raw.githubusercontent.com/KriszzTzy/Database/main/1/467c69c8-cc17-403d-a0d8-5b732d293a03.jpeg" width="550" alt="R-Baileys Banner" style="border-radius: 25px; border: 5px solid #ff0000;" />
  <br><br>
  
<p align="center">
  <a href="https://krizx.my.id">
    <img src="https://img.shields.io/badge/Website-Official-0A0A0A?style=for-the-badge&logo=google-chrome&logoColor=white"/>
  </a>
  <a href="https://github.com/KriszzTzy/Reze-WABot">
    <img src="https://img.shields.io/badge/GitHub-Repository-0A0A0A?style=for-the-badge&logo=github&logoColor=white"/>
  </a>
  <a href="https://whatsapp.com/channel/0029VbCMM4VLikgFv0JplT2D">
    <img src="https://img.shields.io/badge/WhatsApp-Channel-0A0A0A?style=for-the-badge&logo=whatsapp&logoColor=white"/>
  </a>
</p>

---

<p align="center">
  <strong>Optimized for WhatsApp Bot APIs</strong><br/>
  <sub>Powered by the ideas behind Reze WABot (Beta)</sub>
</p>

<p align="center">
  <a href="https://github.com/KriszzTzy/Reze-WABot">
    <img src="https://img.shields.io/badge/WhatsApp%20Bot%20Beta-111111?style=for-the-badge&logo=github&logoColor=white"/>
  </a>
</p>

---

## Overview

**Reze-Baileys — Sockets** is a modern WebSocket library for building WhatsApp bots and automation systems.  
It focuses on performance, simplicity, and a clean developer experience — without unnecessary overhead.

No Selenium. No Chromium. Just a fast, lightweight connection built for real-time messaging.

---

## ✦ Why using Reze-Baileys??

- ⚡ **Fast by design** — optimized for real-time performance  
- 🧩 **Simple to use** — clean API, easy integration  
- 🪶 **Lightweight** — no heavy dependencies  
- 🔐 **Modern authentication** — secure pairing code (no QR)  
- 🎯 **Production ready** — stable and reliable  
- 🤖 **AI-ready** — supports WhatsApp `AI ✦` message badge  
- 🔘 **Button support** — native flow buttons, lists, CTAs, carousel  

---

## ✦ Features

- Multi-device support  
- Pairing code login (no QR scan required) 
- Pure JavaScript and TypeScript
- Actively maintained by **Kristian**
- **Interactive buttons** (reply, URL, copy, call, list, etc..)
- **Carousel messages** with image cards and per-card buttons
- **AI Rich Message** messages with ai response 

---

## Installation & Setup

### Via `package.json`

Edit your package.js file

```json
"dependencies": {
    "baileys": "github:KriszzTzy/R-Baileys"
}
```

> Requires Node.js **>= 20.0.0**

---

## 📚 Index

- 🔗 [Connecting Account](#connecting-account)
  - 🔑 [Connect with Pairing Code](#connect-with-pairing-code)
  - 📷 [Connect with QR Code](#connect-with-qr-code)
- 📤 [Sending Messages](#sending-messages)
  - 💬 [Default Messages](#default-messages)
  - 🔘 [Interactive Buttons](#interactive-buttons)
  - 🤖 [AIRich Response](#airich-response)

---

## Connecting Account

### Connect with Pairing Code

```js
import makeWASocket, { useMultiFileAuthState, DisconnectReason } from 'baileys'
import { Boom } from '@hapi/boom'

const { state, saveCreds } = await useMultiFileAuthState('./session')

const sock = makeWASocket({ auth: state })

sock.ev.on('creds.update', saveCreds)

const code = await sock.requestPairingCode('628XXX')
//Or Custom your code:
//const code = await sock.requestPairingCode('628XXX', 'YOUR1234)
console.log('Pairing code:', code)

sock.ev.on('connection.update', ({ connection, lastDisconnect }) => {
    if (connection === 'close') {
        const shouldReconnect =
            (lastDisconnect?.error instanceof Boom)
                ? lastDisconnect.error.output.statusCode !== DisconnectReason.loggedOut
                : true
        if (shouldReconnect) { /* reconnect */ }
    } else if (connection === 'open') {
        console.log('Connected to WhatsApp!')
    }
})
```

### Connect with QR Code

```js
import makeWASocket, { useMultiFileAuthState } from 'baileys'
import qrcode from 'qrcode-terminal'

const { state, saveCreds } = await useMultiFileAuthState('./session')
const sock = makeWASocket({ auth: state })

sock.ev.on('connection.update', ({ qr }) => {
    if (qr) qrcode.generate(qr, { small: true })
})

sock.ev.on('creds.update', saveCreds)
```

## Sending Messages

### Default Messages
Send Messages Using Text, Photos, and Videos.

<details>
<summary><strong>Example Code</strong></summary>

```js
// Text Messages
await sock.sendMessage(jid, {
    text: "Hi, I'm using the R-Baileys library!"
}, { quoted: m })

// Image Messages
await sock.sendMessage(jid, {
    caption: "Hi, I'm using the R-Baileys library!"
    image: fs.readFileSync('./path/file.jpg') // Url Or Path 
}, { quoted: m })

// Video Messages
await sock.sendMessage(jid, {
    caption: "Hi, I'm using the R-Baileys library!",
    video: { url: 'https://example.com' } // Url Or Path
}, { quoted: m })
```
</details>

---

## Interactive Buttons

### Interactive Messages
Create interactive messages with button options and quick replies.

<details>
<summary><strong>Example Code</strong></summary>

```js
// Button Reply
await sock.sendMessage(jid, {
    interactiveMessage: {
        text: "Select the available menu:",
        footer: "Click one of the buttons below",
        buttons: [
            { type: 'reply', text: '📦 Check Order', id: 'check_order' },
            { type: 'reply', text: '💰 Promo', id: 'promo' },
            { type: 'reply', text: '🎯 Help', id: 'help' }
        ]
    }
}, { quoted: m })

// Button Copy
await sock.sendMessage(jid, {
    interactiveMessage: {
        text: "Your voucher code:",
        footer: "Click the button to copy",
        buttons: [
            { type: 'copy', text: '📋 DISCOUNT50', copy_code: 'DISCOUNT50', id: 'copy_voucher' }
        ]
    }
}, { quoted: m })

// Button URL
await sock.sendMessage(jid, {
    interactiveMessage: {
        text: "Visit our website:",
        footer: "Click to open link",
        buttons: [
            { type: 'url', text: '🌐 Website', url: 'https://example.com' },
            { type: 'url', text: '📱 Instagram', url: 'https://instagram.com/example', webview: true }
        ]
    }
}, { quoted: m })

// Button Selection
await sock.sendMessage(jid, {
    interactiveMessage: {
        text: "Select product category:",
        footer: "Choose one from the list",
        buttons: [
            {
                type: 'selection',
                title: '📱 Product Categories',
                //Optional Icon
                icon: 'default', //default, document, promotion, review
                sections: [
                    {
                        title: "Electronics",
                        rows: [
                            { title: "Smartphone", description: "Latest 2024 phones", id: "phone" },
                            { title: "Laptop", description: "For work and gaming", id: "laptop" }
                        ]
                    },
                    {
                        title: "Fashion",
                        rows: [
                            { title: "Clothes", description: "Latest models", id: "clothes" },
                            { title: "Shoes", description: "Original", id: "shoes" }
                        ]
                    }
                ]
            }
        ]
    }
}, { quoted: m })

// Button Catalog Greeting 
// Noted: This button does not work if there is only 1 button, maximum 2.
// Here is an example with the Url button.
await sock.sendMessage(jid, {
    interactiveMessage: {
    text: "Check out our latest product!",
    footer: "Follow my Channel Or Click the button for details",
    buttons: [        
        { 
          type: 'url', text: 'WhatsApp Channel', url: "https://whatsapp.com/channel/0029VbCMM4VLikgFv0JplT2D"
        },
        {
        // catalog_greeting or cta_catalog
        type: 'catalog_greeting',
            business_phone_number: '123456789',
            catalog_product_id: '123456789' }
    ]
}
}, { quoted: m })

// Button Example With Media
await sock.sendMessage(jid, {
    interactiveMessage: {
        text: "Check out our latest product!",
        footer: "Click the button for details",
        image: "https://example.com/promo-banner.jpg",
        buttons: [
            { type: 'reply', text: '🛒 Buy Now', id: 'buy_now' },
            { type: 'url', text: '🔍 View Details', url: 'https://example.com/product' }
        ]
    }
}, { quoted: m })
```
</details>

---

## AIRich Response

### Rich Message
Create rich msg, AI-powered multimedia messages with code, tables, images, videos, products, and smart suggestions.

<details>
<summary><strong>Example Code</strong></summary>

```js
// Text
await sock.sendMessage(jid, {
    richMessage: {
        title: "🤖 AI Assistant",
        text: "Hello! How can I help you?\nI'm a virtual assistant ready to help you anytime.",
        suggestions: [
            "Check today's weather",
            "Latest news"
        ]
    }
}, { quoted: m });

// Code Blocks 
await sock.sendMessage(jid, {
    richMessage: {
        title: "💻 JavaScript Code Example",
        text: "Here's a function to calculate Fibonacci:",
        code: {
            language: "javascript",
            content: `function fibonacci(n) {
    if (n <= 1) return n;
    return fibonacci(n - 1) + fibonacci(n - 2);
}

// Usage example
console.log(fibonacci(10)); // Output: 55`
        },
        footer: "Use this code wisely",
        suggestions: ["Explain the code", "Optimize code"]
    }
}, { quoted: m });

// Table Message
await sock.sendMessage(jid, {
    richMessage: {
        title: "📊 Employee Data",
        text: "Here are this month's best employees:",
        table: [
            ["Name", "Position", "Salary", "Bonus"],
            ["John Doe", "Senior Developer", "$15,000", "$2,000"],
            ["Jane Smith", "UI/UX Designer", "$12,000", "$1,500"],
            ["Mike Johnson", "Project Manager", "$18,000", "$3,000"]
        ],
        footer: "Data as of December 2024",
        suggestions: ["View details", "Export to Excel"]
    }
}, { quoted: m });

// Hyperlink Message
await sock.sendMessage(jid, {
    richMessage: {
        title: "🔗 Important Links",
        body: "Here are some useful links:",
        text: "Visit [](https://google.com) to search for information, or [GitHub](https://github.com) for programming code.\n\nRead the documentation [here](https://example.com/docs) for a complete guide.",
        suggestions: ["Open Google", "Open GitHub", "View Docs"]
    }
}, { quoted: m });

// Hyperlink with Sources
await sock.sendMessage(jid, {
    richMessage: {
        title: "📰 AI Search Results",
        body: "Based on trusted sources:",
        text: "According to recent research, [climate change](https://ipcc.ch) significantly impacts marine ecosystems. [Read more](https://nature.com/climate-change)",
        sources: [
            ["https://ipcc.ch/favicon.ico", "https://ipcc.ch/report", "IPCC Report 2024"],
            ["https://nature.com/favicon.ico", "https://nature.com/climate", "Nature Climate Change"]
        ],
        footer: "Verified sources",
        suggestions: ["Show data charts", "Compare with last year"]
    }
}, { quoted: m });

// Posts Message
await sock.sendMessage(jid, {
    richMessage: {
        title: "📱 Our Social Media",
        body: "Latest posts from our social media:",
        text: "Follow us for daily updates and promotions!",
        posts: [
            {
                title: "Instagram",
                username: "@ourcompany",
                profile_url: "https://instagram.com/favicon.ico",
                profile_picture_url: "https://f.krizx.my.id/1.jpg",
                thumbnail_url: "https://f.krizx.my.id/2.jpg",
                post_caption: "Check out our new collection! 🔥",
            	deeplink: 'https://instagram.com/p/xxxxx',
                source_app: "INSTAGRAM",
                is_verified: true
            },
            {
                title: "Facebook",
                username: "@ourcompany",
                profile_url: "https://facebook.com/favicon.ico", 
                profile_picture_url: "https://f.krizx.my.id/1.jpg",
                thumbnail_url: "https://f.krizx.my.id/2.jpg",
                post_caption: "Big announcement coming soon! 🎉",
            	deeplink: 'https://facebook.com/xxxxx',
                source_app: "FACEBOOK",
                is_verified: true
            },
            {
                title: "Threads",
                username: "@ourcompany",
                profile_url: "https://threads.net/favicon.ico",
                profile_picture_url: "https://f.krizx.my.id/1.jpg",
                thumbnail_url: "https://f.krizx.my.id/2.jpg",
                post_caption: "What's on your mind today? 💭",
            	deeplink: 'https://threads.net/@ourcompany/post/xxxxx',
                source_app: "THREADS",
                is_verified: false
            }
        ],
        suggestions: ["Follow Instagram", "Like Facebook", "Join Threads"]
    }
}, { quoted: m });

// Products Message
await sock.sendMessage(jid, {
    richMessage: {
        title: "🛍️ Product Recommendations",
        body: "Based on your search history:",
        products: [
            {
                title: "RGB Gaming Headset",
                brand: "AudioTech",
                price: "$49.99",
                sale_price: "$39.99",
                image: "https://f.krizx.my.id/1.jpg",
                url: "https://shop.com/product/headset123"
            },
            {
                title: "Wireless Mouse",
                brand: "LogiTech",
                price: "$35.00",
                image: "https://f.krizx.my.id/1.jpg",
                url: "https://shop.com/product/mouse456"
            },
            {
                title: "Mechanical Keyboard",
                brand: "Keychron",
                price: "$120.00",
                sale_price: "$99.99",
                image: "https://f.krizx.my.id/1.jpg",
                url: "https://shop.com/product/keyboard789"
            }
        ],
        footer: "Click product to buy",
        suggestions: ["View all products", "Filter by price", "Sort by bestseller"]
    }
}, { quoted: m });
```
</details>

---

## 🌐 Links

<p align="center">
<a href="https://krizx.my.id">
  <img src="https://img.shields.io/badge/Website-Official-black?style=for-the-badge&logo=google-chrome&logoColor=white"/>
</a>
<a href="https://whatsapp.com/channel/0029VbCMM4VLikgFv0JplT2D">
  <img src="https://img.shields.io/badge/WhatsApp-Channel-25D366?style=for-the-badge&logo=whatsapp&logoColor=white"/>
</a>
<a href="https://github.com/KriszzTzy/Reze-WABot">
  <img src="https://img.shields.io/badge/GitHub-Repository-181717?style=for-the-badge&logo=github&logoColor=white"/>
</a>
</p>

---

### 🐞 Found a Bug?

If you encounter a bug or issue while using this project, please do one of the following:

- **Email Community** via official Gmail (kriszztzyofficial@gmail.com)
- **Contact the maintainer directly** via WhatsApp

<p align="center">
  <a href="https://wa.me/message/HHFFLIFTDNWDF1" target="_blank" rel="noopener noreferrer">
    <img
      alt="Chat on WhatsApp"
      src="https://img.shields.io/badge/Chat%20on%20WhatsApp-25D366?style=for-the-badge&logo=whatsapp&logoColor=white"
    />
  </a>
</p>
<details>
<summary>🙏 <strong>TQTO (Thanks To)</strong></summary>

Thank you to all parties who have provided support, inspiration, and contributions—both directly and indirectly—in the development of this project:

- **Allah SWT** — for all His mercy, ease and protection.
- **Parents** — for your endless love, prayers and support.
- **[Nstar-Y / Nstar-bail](https://github.com/nstar-y/bail)** — as an initial foundation and reference in the development of this system.
- **[Kriszz Hayanasi](https://github.com/KriszzTzy)** (Me)
The main developer of this project.

</details>

> [!WARNING]
> This PROJECT is built on top of the WhiskeySockets/Baileys project. All the original core logic is their own. R-Baileys extends it with thoughtful UX and DX improvements.

---

### 🙌 Contributors outside of Baileys code

Thanks to the following great contributors who helped improve this project 💖

<table>
  <tr>
    <td align="center">
      <a href="https://github.com/KriszzTzy">
        <img src="https://avatars.githubusercontent.com/u/194907727?v=4" width="80px;" style="border-radius:50%;" alt="Dev"/>
        <br />
        <sub><b>Kriszz</b></sub>
      </a>
    </td>
  </tr>
</table>

<img src="https://user-images.githubusercontent.com/74038190/212284100-561aa473-3905-4a80-b561-0d28506553ee.gif" width="100%" style="transform: rotate(180deg);">
