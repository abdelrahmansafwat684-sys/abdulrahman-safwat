import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const css = readFileSync(new URL('../styles.css', import.meta.url), 'utf8');
const script = readFileSync(new URL('../script.js', import.meta.url), 'utf8');
const readme = readFileSync(new URL('../README.md', import.meta.url), 'utf8');
const HOST = 'abdelrahmansafwat684-sys';
const repo = `https://github.com/${HOST}/abdulrahman-safwat`;

const checks = [
  ['name present', () => assert.match(html, /Abdulrahman Safwat/i)],
  ['four project cards', () => assert.equal((html.match(/class="project (?:project-featured|small-project)"/g) || []).length, 4)],
  ['CloudGuard project', () => assert.match(html, /CloudGuard/)],
  ['GCP automation project', () => assert.match(html, /GCP Security/)],
  ['Triage project', () => assert.match(html, /Vulnerability(?:<br>|\s+)Triage/)],
  ['security toolkit project', () => assert.match(html, /Security Review/)],
  ['CloudGuard live demo link', () => assert.ok(html.includes(`https://${HOST}.github.io/abdulrahman-safwat/`))],
  ['GCP project correct source', () => assert.ok(html.includes(`${repo}/tree/main/projects/gcp-security-automation`))],
  ['Vulnerability Triage source', () => assert.ok(html.includes(`${repo}/tree/main/projects/vulnerability-triage`))],
  ['Security Review source', () => assert.ok(html.includes(`${repo}/tree/main/security-toolkit`))],
  ['Case study link', () => assert.ok(html.includes(`${repo}/blob/main/projects/cloud-posture-dashboard/CASE_STUDY.md`))],
  ['README link to deployed portfolio route', () => assert.ok(readme.includes('/abdulrahman-safwat/portfolio/'))],
  ['document lang', () => assert.match(html, /<html lang="en">/)],
  ['mobile viewport', () => assert.match(html, /name="viewport"/)],
  ['skip to content', () => assert.match(html, /class="skip" href="#main"/)],
  ['external links protected', () => { for (const match of html.matchAll(/<a[^>]+target="_blank"[^>]*>/g)) assert.match(match[0], /rel="noopener noreferrer"/); }],
  ['no HTML forms', () => assert.doesNotMatch(html, /<form[\s>]/i)],
  ['no credential-like content', () => assert.doesNotMatch(html, /(?:AIza[\w-]{25,}|-----BEGIN PRIVATE KEY-----|github_pat_[\w-]{12,})/)],
  ['fictional-data notice', () => assert.match(html, /simulated data|fictional|synthetic/i)],
  ['author email', () => assert.ok(html.includes('mailto:abdelrahmansafwat684@gmail.com'))],
  ['filters wired', () => assert.match(script, /applyFilter\(button\.dataset\.filter\)/)],
  ['filters accessible', () => assert.match(script, /aria-pressed/)],
  ['mobile menu ARIA', () => assert.match(script, /aria-expanded/)],
  ['reduced motion support', () => assert.match(css, /prefers-reduced-motion/)],
  ['responsive breakpoint', () => assert.match(css, /@media\s*\(max-width:/)],
  ['focus style', () => assert.match(css, /focus-visible/)],
];
for(const [name,fn] of checks) test(name,fn);

// Additional regression checks for discoverability, navigation and the printable profile.
const sheet = readFileSync(new URL('../project-sheet.html', import.meta.url), 'utf8');
const sheetCss = readFileSync(new URL('../project-sheet.css', import.meta.url), 'utf8');
const sitemap = readFileSync(new URL('../sitemap.xml', import.meta.url), 'utf8');
const fullUrl = 'https://abdelrahmansafwat684-sys.github.io/abdulrahman-safwat';
const structuredMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);

const enhancements = [
  ['canonical URL and crawlable metadata', () => {
    assert.match(html, /rel="canonical"/);
    assert.ok(html.includes(`${fullUrl}/portfolio/`));
    assert.match(html, /name="twitter:card" content="summary"/);
    assert.match(html, /property="og:site_name"/);
  }],
  ['Person structured data is valid JSON and links the public profile', () => {
    assert.ok(structuredMatch);
    const value = JSON.parse(structuredMatch[1]);
    assert.equal(value['@type'], 'Person');
    assert.equal(value.hasPart.length, 4);
    assert.equal(value.sameAs[0], `https://github.com/${HOST}`);
  }],
  ['project filter live region is declared', () => {
    assert.match(html, /id="filter-status"[^>]*role="status"[^>]*aria-live="polite"/);
    assert.match(script, /visible \+= 1/);
  }],
  ['hidden project cards are truly removed from layout', () => {
    assert.match(css, /\.project\[hidden\]\{display:none!important\}/);
  }],
  ['mobile menu supports Escape, outside clicks and focus return', () => {
    assert.match(script, /event\.key === 'Escape'/);
    assert.match(script, /menuButton\.focus\(\)/);
    assert.match(script, /nav\.contains\(event\.target\)/);
  }],
  ['printable project brief linked from homepage', () => {
    assert.match(html, /href="project-sheet.html"/);
    assert.match(sheet, /Print \/ save as PDF/);
    assert.match(sheetCss, /@page\{size:A4/);
    assert.match(sheetCss, /@media print/);
  }],
  ['project brief has four project references and contact', () => {
    for (const word of ['CloudGuard', 'GCP Security Automation', 'Vulnerability Triage Engine', 'Security Review Toolkit']) {
      assert.ok(sheet.includes(word));
    }
    assert.match(sheet, /mailto:abdelrahmansafwat684@gmail.com/);
    assert.match(sheet, /simulated|synthetic/i);
  }],
  ['sitemap includes CloudGuard and both portfolio pages', () => {
    for (const url of [`${fullUrl}/`, `${fullUrl}/portfolio/`, `${fullUrl}/portfolio/project-sheet.html`]) {
      assert.ok(sitemap.includes(`<loc>${url}</loc>`));
    }
  }],
  ['all relative href resources and on-page anchors exist', () => {
    const fs = { existsSync };
    const from = new URL('../index.html', import.meta.url);
    const toCheck = [html, sheet];
    const fileBySource = [from, new URL('../project-sheet.html', import.meta.url)];
    for (const [index, content] of toCheck.entries()) {
      for (const match of content.matchAll(/\bhref="([^"]+)"/g)) {
        const href = match[1];
        if (href.startsWith('#')) {
          const id = href.slice(1);
          assert.ok(content.includes(`id="${id}"`), `Missing anchor ${href}`);
        } else if (!/^(https?:|mailto:)/i.test(href)) {
          const target = new URL(href, fileBySource[index]);
          assert.ok(fs.existsSync(target), `Missing local file ${href}`);
        }
      }
    }
  }],
  ['new pages do not add remote code, trackers, or private credentials', () => {
    for (const content of [html, sheet]) {
      assert.doesNotMatch(content, /<script\s+[^>]*src="https?:/i);
      assert.doesNotMatch(content, /google-analytics|gtag\(|pixel\.facebook|segment\.io/i);
      assert.doesNotMatch(content, /-----BEGIN PRIVATE KEY-----|github_pat_[a-zA-Z0-9_-]+|AIza[a-zA-Z0-9_-]{25,}/);
    }
  }],
];
for (const [name, fn] of enhancements) test(name, fn);

