const fs = require('fs');
const path = require('path');

const transcriptDir = 'C:/Users/laypop-kki/.cursor/projects/d-15-seminor-defense/agent-transcripts';
const outPath = path.join(__dirname, '..', 'css', 'demo.css');

const events = [];

function walk(dir) {
    fs.readdirSync(dir).forEach(function (f) {
        const full = path.join(dir, f);
        if (fs.statSync(full).isDirectory()) {
            walk(full);
            return;
        }
        if (!f.endsWith('.jsonl')) {
            return;
        }
        const stat = fs.statSync(full);
        const lines = fs.readFileSync(full, 'utf8').split('\n');
        lines.forEach(function (line, lineNo) {
            if (line.indexOf('demo.css') < 0) {
                return;
            }
            let o;
            try {
                o = JSON.parse(line);
            } catch (e) {
                return;
            }
            const ts = stat.mtimeMs + lineNo * 0.001;
            const parts = (o.message && o.message.content) || [];
            parts.forEach(function (c) {
                if (!c.input || !c.input.path || c.input.path.indexOf('demo.css') < 0) {
                    return;
                }
                if (c.name === 'Write' && c.input.contents) {
                    events.push({ ts: ts, type: 'write', contents: c.input.contents });
                }
                if (c.name === 'StrReplace' && c.input.old_string && c.input.new_string !== undefined) {
                    events.push({
                        ts: ts,
                        type: 'replace',
                        old_string: c.input.old_string,
                        new_string: c.input.new_string
                    });
                }
            });
        });
    });
}

walk(transcriptDir);
events.sort(function (a, b) {
    return a.ts - b.ts;
});

let css = '';
events.forEach(function (ev, idx) {
    if (ev.type === 'write') {
        css = ev.contents;
        return;
    }
    if (ev.type === 'replace') {
        if (css.indexOf(ev.old_string) < 0) {
            console.warn('patch', idx, 'miss — old_string not found, len', ev.old_string.length);
            return;
        }
        css = css.split(ev.old_string).join(ev.new_string);
    }
});

console.log('events', events.length, 'final len', css.length, 'has map-gym', css.indexOf('map-gym') >= 0);
fs.writeFileSync(outPath, css);
