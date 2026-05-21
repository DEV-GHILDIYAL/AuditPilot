/**
 * @type {import('electron-builder').Configuration}
 * @see https://www.electron.build/configuration/configuration
 */
module.exports = {
  appId: 'com.auditpilot.app',
  productName: 'AuditPilot',
  copyright: 'Copyright © 2026 AuditPilot',
  publish: 'never',
  directories: {
    output: 'dist-electron',
    buildResources: 'assets'
  },
  files: [
    'dist/**/*',
    'electron/**/*',
    'package.json'
  ],
  win: {
    target: [
      {
        target: 'portable',
        arch: ['x64']
      }
    ],
    icon: 'assets/icon.png'
  },
  nsis: {
    oneClick: false,
    allowToChangeInstallationDirectory: true,
    createDesktopShortcut: true,
    createStartMenuShortcut: true,
    shortcutName: 'AuditPilot'
  },
  mac: {
    target: ['dmg'],
    icon: 'assets/icon.png'
  },
  linux: {
    target: ['AppImage'],
    category: 'Utility'
  }
};
