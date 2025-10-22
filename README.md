# ClipboardSync LAN

Cross-platform clipboard sync app for your local network. Share text and images between devices instantly - no cloud, no bullshit.

## What's the deal?

Ever wanted to copy something on your Mac and paste it on your Windows PC? Or vice versa? This app does exactly that. Works over your local network, everything's encrypted, and it's dead simple to use.

<img width="408" height="665" alt="Снимок экрана 2025-10-23 в 02 36 32" src="https://github.com/user-attachments/assets/0a7357d1-953d-4f90-97e4-0d67bbcb9254" />

## Features

- ✅ **Real-time clipboard sync** - Copy on one device, paste on another
- ✅ **Image support** - Screenshots, copied images, whatever
- ✅ **Auto-discovery** - Finds other devices on your network automatically
- ✅ **AES-256 encryption** - Your data stays private
- ✅ **Clipboard history** - Last 10 items, click to restore
- ✅ **Server/Client modes** - One device hosts, others connect
- ✅ **Cross-platform** - Works on macOS and Windows
- ✅ **Password protection** - Keep your network secure
- ✅ **System notifications** - Know when stuff gets synced
- ✅ **Auto-launch** - Starts with your system

## Requirements

- **Node.js 20+** (seriously, don't use older versions)
- npm or yarn

## Quick Start

```bash
# Install dependencies
npm install

# Run the app
npm start
```

## How it works

### Server Mode
1. Launch the app
2. Hit **Server Mode**
3. Set a password
4. Click **Start Sync**

Your device becomes the hub - other devices connect to you.

### Client Mode
1. Launch the app
2. Hit **Client Mode**
3. Use the same password as the server
4. Leave Server IP empty for auto-discovery OR enter server IP manually
5. Click **Start Sync**

The client will find and connect to your server automatically.

## Settings

- **Auto-discovery** - Automatically find servers on your network
- **Auto-launch** - Start the app when your system boots

## Security

- Everything's encrypted with AES-256
- Password authentication required
- Only works on your local network (no internet needed)
- Your data never leaves your network

## Tech Stack

```
clipboard-sync-lan/
├── main.js                 # Electron main process
├── package.json           # Dependencies and scripts
├── src/                   # Core modules
│   ├── config.js          # Configuration
│   ├── encryption.js      # AES-256 encryption
│   ├── udpDiscovery.js    # UDP auto-discovery
│   ├── clipboardWatcher.js # Clipboard monitoring
│   ├── clipboardHistory.js # History management
│   ├── tcpServer.js       # TCP server
│   └── tcpClient.js       # TCP client
└── renderer/              # UI
    ├── index.html         # HTML markup
    ├── renderer.js        # Renderer process
    └── styles.css         # Styles
```

## Network Details

- **TCP** (port 8888) - Reliable data transmission
- **UDP** (port 41234) - Device discovery
- App automatically finds free ports if 8888 is busy

## Encryption

Uses AES-256-CBC with:
- Random IV for each message
- Key derived from password via SHA-256
- All TCP packets encrypted before transmission

## Clipboard Sync

- Checks for changes every 1 second
- Auto-sends to all connected devices
- Supports text and images
- Uses native Electron clipboard API (no more clipboardy issues)

## Architecture

Built with **OOP approach**:
- Each module is a separate class
- All values configurable via `Config` class
- Logic encapsulated in class methods
- Clear separation of concerns

## Debugging

```bash
# Run with DevTools
npm run dev
```

Check the Electron console for logs.

## Building

```bash
# Build for current platform
npm run build

# Build for macOS
npm run build:mac

# Build for Windows
npm run build:win
```

## Important Notes

1. **Ports**: Uses port 8888 (TCP) and 41234 (UDP) by default
   - App automatically finds free ports if these are busy
2. **Firewall**: Make sure ports aren't blocked
3. **Local network**: Devices must be on the same subnet
4. **Password**: Use a strong password to protect your data
5. **Image size**: Limited to 1 MB for images

## Security Best Practices

- Don't use on public networks
- Use strong passwords
- All data is encrypted but only transmitted on your local network
- Configure trusted device list if needed

## Troubleshooting

If you're having issues:

1. Make sure devices are on the same network
2. Check that ports aren't blocked
3. Verify the password is correct
4. Check the console logs

## License

MIT

## Contributing

Feel free to submit issues and pull requests.
