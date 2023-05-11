import * as _window from './window'
import document from './document'

const global = GameGlobal

GameGlobal.global = GameGlobal.global || global

function inject() {
    _window.document = document;

    _window.addEventListener = (type, listener) => {
        _window.document.addEventListener(type, listener)
    }
    _window.removeEventListener = (type, listener) => {
        _window.document.removeEventListener(type, listener)
    }
    _window.dispatchEvent = function(event = {}) {
        console.log('window.dispatchEvent', event.type, event);
        // nothing to do
    }

    const { platform } = wx.getSystemInfoSync()

    // 开发者工具无法重定义 window
    if (typeof __devtoolssubcontext === 'undefined' && platform === 'devtools') {
        for (const key in _window) {
            const descriptor = Object.getOwnPropertyDescriptor(global, key)

            if (!descriptor || descriptor.configurable === true) {
                Object.defineProperty(window, key, {
                    value: _window[key]
                })
            }
        }

        for (const key in _window.document) {
            const descriptor = Object.getOwnPropertyDescriptor(global.document, key)

            if (!descriptor || descriptor.configurable === true) {
                Object.defineProperty(global.document, key, {
                    value: _window.document[key]
                })
            }
        }
        window.parent = window
        window.wx = wx
    } else {
        _window.wx = wx;
        for (const key in _window) {
            global[key] = _window[key]
        }
        global.window = global
        global.top = global.parent = global
    }
}

if (!GameGlobal.__isAdapterInjected) {
    GameGlobal.__isAdapterInjected = true
    inject()
}
