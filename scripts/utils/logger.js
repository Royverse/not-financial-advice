const pc = require("picocolors");

/**
 * High-Touch Quant Engine Logger
 * Implements strict precision terminal outputs.
 */

function getTimestamp() {
    return new Date().toISOString();
}

function log(module, status, type, message, meta = {}) {
    // Determine Type Config
    let typeConfig = { label: type, color: pc.gray };
    if (type === "INIT") typeConfig = { label: "INIT", color: pc.blue };
    if (type === "EXEC") typeConfig = { label: "EXEC", color: pc.cyan };
    if (type === "RSLT") typeConfig = { label: "RSLT", color: pc.green };
    if (type === "WARN") typeConfig = { label: "WARN", color: pc.yellow };
    if (type === "FAIL") typeConfig = { label: "FAIL", color: pc.red };
    
    // Determine Base Prefix
    const prefix = `[NFA:${module}] ${pc.dim(getTimestamp())} | ${typeConfig.color(typeConfig.label.padEnd(4))} |`;
    
    // Format Meta
    let metaStr = "";
    if (meta && Object.keys(meta).length > 0) {
        metaStr = Object.entries(meta).map(([k, v]) => `${pc.gray(k)}: ${typeof v === 'number' && k.toLowerCase().includes('latency') ? pc.yellow(v + 'ms') : v}`).join(" | ");
    }

    console.log(`${prefix} ${message} ${metaStr ? `| ${metaStr}` : ''}`);
}

module.exports = {
    init: (module, message, meta) => log(module, "INFO", "INIT", message, meta),
    exec: (module, message, meta) => log(module, "INFO", "EXEC", message, meta),
    rslt: (module, message, meta) => log(module, "INFO", "RSLT", message, meta),
    warn: (module, message, meta) => log(module, "WARN", "WARN", message, meta),
    fail: (module, message, meta) => log(module, "FAIL", "FAIL", message, meta),
};
