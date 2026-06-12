const fs = require('fs');
const path = require('path');

const root = 'C:/Users/laypop-kki/.cursor/projects/d-15-seminor-defense/agent-transcripts';
const out = path.join(__dirname, '..', 'css', 'demo.css');

let best = null;

function walk(dir) {
    let files;
    try {
        files = fs.readdirSync(dir);
    } catch (e) {
        return;
    }
    files.forEach(function (f) {
        const full = path.join(dir, f);
        let st;
        try {
            st = fs.statSync(full);
        } catch (e2) {
            return;
        }
        if (st.isDirectory()) {
            walk(full);
            return;
        }
        if (!f.endsWith('.jsonl')) {
            return;
        }
        const lines = fs.readFileSync(full, 'utf8').split('\n');
        lines.forEach(function (line) {
            if (line.indexOf('demo.css') < 0 || line.indexOf('Write') < 0) {
                return;
            }
            let o;
            try {
                o = JSON.parse(line);
            } catch (e3) {
                return;
            }
            const parts = (o.message && o.message.content) || [];
            parts.forEach(function (c) {
                if (c.name !== 'Write' || !c.input || !c.input.path || c.input.path.indexOf('demo.css') < 0) {
                    return;
                }
                const contents = c.input.contents || '';
                if (!best || contents.length > best.len) {
                    best = {
                        len: contents.length,
                        contents: contents,
                        hasGym: contents.indexOf('map-gym') >= 0,
                        hasHudRight: contents.indexOf('hud-right') >= 0,
                        hasEvo: contents.indexOf('evo-ready') >= 0,
                        file: full
                    };
                }
            });
        });
    });
}

walk(root);
if (best) {
    console.log(JSON.stringify({ len: best.len, hasGym: best.hasGym, hasHudRight: best.hasHudRight, hasEvo: best.hasEvo, file: best.file }, null, 2));
    fs.writeFileSync(out, best.contents);
} else {
    console.log('not found');
    process.exit(1);
}
