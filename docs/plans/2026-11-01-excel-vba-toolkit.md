# Excel VBA Toolkit Implementation Plan

> **For agentic workers:** Use the host's available task-by-task implementation workflow. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an isolated, provenance-tracked Excel VBA toolkit and specialist role profile without changing uneXpected's existing AI orchestration behavior.

**Architecture:** Store importable `.bas` modules under `integrations/excel-vba-kit/`, with a manifest, upstream MIT notice, and usage/safety documentation. Add a specialist profile as a role specification, plus Node.js static checks and a separate GitHub Actions workflow; do not connect VBA execution to the Node.js/Render service.

**Tech Stack: We use Node.js 22 built-in test runner, VBA 7/Microsoft Excel desktop object model, GitHub Actions, and a feature branch.

## Global Constraints

- Work on `feature/excel-vba-toolkit`; do not commit to `main` or deploy the Render service.
- Preserve the upstream MIT copyright and license notice and record the reviewed source tree SHA.
- Require explicit Workbook/Worksheet references for workbook inspection.
- File inventory must be read-only; never remove protection, break links, mutate Outlook, or overwrite user data.
- Application performance changes must capture and restore every changed setting; do not alter workbook link-update settings.
- A specialist profile is documentation until connected to an authoritative runtime registry. Do not claim it is active.
- Node tests prove static source/contract properties only. Excel compile/runtime tests remain a separate desktop verification gate.

---

### Task 1: Curated, safe VBA source package

**Files:**
- Create: `integrations/excel-vba-kit/manifest.json`
- Create: `integrations/excel-vba-kit/LICENSEX
KHÜ™X]Nˆ[YÜ˜][ÛœËÙ^Ù[]˜˜KZÚ]Ô‘PQQK›Y‹HÜ™X]Nˆ[YÜ˜][ÛœËÙ^Ù[]˜˜KZÚ]Û[Ù[\ËÛ[Ù^ÛÜšØ›ÛÚË˜˜\Ø‹HÜ™X]Nˆ[YÜ˜][ÛœËÙ^Ù[]˜˜KZÚ]Û[Ù[\ËÛ[Ù^š[TŞ\İ[K˜˜\Ø‹HÜ™X]Nˆ[YÜ˜][ÛœËÙ^Ù[]˜˜KZÚ]Û[Ù[\ËÛ[Ù^^˜˜\Ø‹HÜ™X]Nˆ[YÜ˜][ÛœËÙ^Ù[]˜˜KZÚ]Û[Ù[\ËÛ[Ù^\XØ][Û”İ]K˜˜\Ø‹HÜ™X]Nˆ[YÜ˜][ÛœËÙ^Ù[]˜˜KZÚ]Û[Ù[\ËÛ[Ù^XYÛ›ÜİXÜË˜˜\Ø‹H\İˆ\İÙ^Ù[]˜˜KZÚ]\İ›ZœØ‚ŠŠ’[\™˜XÙ\ÎŠŠ‚‹H›ÙXÙ\Îˆ^ÛÜšÜÚY]^\İÊØ‹ÛÜšÜÚY]˜[YJX^\İ\ÙY›İÊÜÊX^\İ\ÙYÛÛ[[ŠÜÊX^š[Q^\İÊš[T]
X^›Û\‘^\İÊ›Û\”]
X^Ù[Xİ›Û\Š‹‹ŠX^Ù[Xİš[J‹‹ŠX^\İš[\Ê›Û\”][˜ÛYTİX™›Û\œÊX^š[™Ù^]ÛÜ™Ê^ÔÙX\˜ÚÙ^]ÛÜ™˜[™ÙK[[Z]\ŠX^™YÚ[‘˜\İ[ÙJİ]JX^™\İÜ™P\XØ][Û”İ]Jİ]JX[™^\[™\œ›Ü“ÙÊ‹‹ŠX‚‹H^\İš[\Ø™]\›œÈHÛÛXİ[ÛˆÙˆ\œ˜^\ÈÛ˜[YK[]Ú^™P]\Ë\İ[ÙYšYYXÈ\œ›ÜœÈ›Üˆ[˜XØÙ\ÜÚX›H\™XİÜšY\È\™H˜Z\ÙYÈHØ[\‹‚‹H[\Hš[KÙ›Û\ˆXÚÙ\ˆÙ[Xİ[Ûˆ™]\›œÈ[ˆ[\Hİš[™ÎÈ[\H›Û\ˆ[™[ÜH™]\›œÈ[ˆ[\HÛÛXİ[Û‹‚‚‹HÈHYH›Øİ\ÙY›ÙH\İ›ÜˆX[šY™\İ›İ™[˜[˜ÙK[Ù[H[\ÜË^XÚ]ÛÜšØ›ÛÚÈ™Y™\™[˜Ù\Ë›Û‹Y\İXİ]™Hš[H[\œË™]™\œÚX›H\XØ][Ûˆİ]K[™\[™[Û›HØ[š]^™YÙÙÚ[™Ë‚‹HÈH[ˆ›ÙHK]\İ\İÙ^Ù[]˜˜KZÚ]\İ›ZœØ[™™XÛÜ™HZ\ÜÚ[™Ë\XÚØYÙH˜Z[\™H™Y›Ü™H[\[Y[][Û‹‚‹HÈH[\[Y[Hš]™Hİ[™\™[Ù[\ÈÚ]Ü[Ûˆ^XÚ]›È^\›˜[H™Y™\™[˜Ù\Ë^XÚ]Øš™Xİ\™İ[Y[Ë[™›İ[™YÚYHY™™XİË‚‹HÈH[\ÜX›H[Ù[HÛİ\˜ÙH\Ù\È˜˜\Øš[\È[™X]Ú[™È]šX]H—Ó˜[YXXÛ\˜][ÛœË‚‹HÈH™\[ˆHØ[YH\İÈ^XİYˆ[İ]XÈÛÛ˜Xİ\ÜÙ\[ÛœÈ\ÜË‚‚ˆÈÈÈ\ÚÈˆÜXÚX[\İ›Ùš[H[™ØY™]H›İ[™\šY\Â‚ŠŠ‘š[\ÎŠŠ‚‹HÜ™X]NˆÜXÚX[\İËÙ^Ù[]˜˜KĞQÑS•›Y‹HÜ™X]NˆÜXÚX[\İËÙ^Ù[]˜˜KÔ“ÕUS‘Ë›Y‹HÜ™X]NˆÜXÚX[\İËÙ^Ù[]˜˜KÔĞQ‘UK›Y‹H\İˆ\İÙ^Ù[]˜˜KZÚ]\İ›ZœØ‚ŠŠ’[\™˜XÙ\ÎŠŠ‚‹H›ÙXÙ\ÈH›ÛHÜXÚYšXØ][Û‹›İ][™È[\Ë[™ØY™]HÛXŞKˆ\ÙH\™H›İ[[YH™YÚ\İHXİ]˜][Û‹‚‹H™\]Z\™\È›İ™[˜[˜ÙH›Üˆ™]\ÙYÛÙKXİX[ÛÜšØ›ÛÚÈØÚ[XH[œÜXİ[Û‹[™^XÚ]\›İ˜[›Üˆ\İXİ]™HÜˆ^\›˜[Xİ[ÛœË‚‚‹HÈHY\İÈ›ÜˆH[[YH›İ[™\K›İ™[˜[˜ÙH™\]Z\™[Y[Ë[™^XÚ]X\›İ˜[ÛXŞK‚‹HÈH[ˆH›Øİ\ÙY\İ[™™XÛÜ™Z\ÜÚ[™ÈÜXÚX[\İš[\È\ÈH^XİY˜Z[\™HYˆ[\[Y[[™È\È\ÚÈ[™\[™[K‚‹HÈHYH™YH›ÛHØİ[Y[Ë[˜ÛY[™ÈÜ™X]YÜİ]XË]\İYÑ^Ù[XÛÛ\[YÜ[[YK]\İY\İ[˜İ[ÛœË‚‹HÈH™\[ˆH›Øİ\ÙY\İÈ^XİYˆH›ÛHÜXÚYšXØ][Ûˆ[™İX\™˜Z[È\™H›İ[™‚‚ˆÈÈÈ\ÚÈÎˆÒH[™›Ü˜Ù[Y[[™[™Ù™ˆØİ[Y[][Û‚‚ŠŠ‘š[\ÎŠŠ‚‹HÜ™X]Nˆ™Ú]X‹İÛÜšÙ›İÜËÙ^Ù[]˜˜KZÚ][[‹HÜ™X]NˆØÜËÜ[œËÌŒ‹LLKLKY^Ù[]˜˜K]ÛÛÚ]›Y‹H[ÙYNˆ›Û™HÙˆH^\İ[™È\XØ][Ûˆ[[YHš[\Ë‚‚ŠŠ’[\™˜XÙ\ÎŠŠ‚‹HÒH[œÈ›ÙHKXÚXÚÈ\İÙ^Ù[]˜˜KZÚ]\İ›ZœØ[™›ÙHK]\İ\İÙ^Ù[]˜˜KZÚ]\İ›ZœØÛˆ™[]˜[\Ú\È[™[™\]Y\İË‚‹H‘PQQH™XÛÜ™ÈH^Ù[\ÚİÜ˜[Y][ÛˆØ]H[™H›ÙKšœËÔ™[™\ˆ^Xİ][Ûˆ›İ[™\K‚‚‹HÈHYHÛÜšÙ›İÈØÛÜYÈÛÛÚ]ÜXÚX[\İ[‹[™\İ]ÎÈ\ÙH›ÙKšœÈŒ‹‚‹HÈH[ˆ›ÙHKXÚXÚÈ\İÙ^Ù[]˜˜KZÚ]\İ›ZœØ[™›ÙHK]\İ\İÙ^Ù[]˜˜KZÚ]\İ›ZœØØØ[K‚‹HÈH™]šY]ÈHÛÛ\]HÚ[™ÙYYš[H\İ[™[œİ\™H›ÈXZ[‹Xœ˜[˜ÚÜˆ\Ş[Y[Xİ[ÛˆØØİ\œ™Y‚‹HÈHÛÛ[Z]H[YÜ˜][ÛˆÛˆH™X]\™Hœ˜[˜Ú[™™XY˜XÚÈHœ˜[˜Ú™YH[™Ú[™ÙYš[\Ë‚‚ˆÈÈ[œ™\ÛÛ™Y^\›˜[™\šYšXØ][Û‚‚‹HÛÛ\[H[™[ˆ[Ù[\È[ˆZXÜ›ÜÛÙ^Ù[\ÚİÜ
›İ]˜Z[X›H[ˆHİ\œ™[›ÙKšœÈ™\šYšXØ][Ûˆ[š\›Û›Y[
K‚‹HYH›ÛHÈH]]Üš]]]™H[™VXİYÈ™YÚ\İHÛ›HY\ˆ]™YÚ\İKÜXÚØYÙH\È]˜Z[X›HÈH[YÜ˜][ÛˆÛÜšÙ›İÎÈ\È™\ÜÚ]ÜH›Ùš[H[Û™HÙ\È›İXİ]˜]H\Ü]Ú‚‹H˜[Y]HXZ[[˜[˜ÙHÛÜšØ›ÛÚË\ÜXÚYšXÈ]]ÛX][ÛˆÛ›HY\ˆ[œÜXİ[™ÈHXİX[ÛÜšØ›ÛÚÈ[™]È™X[ÛÛ[[œËX›\Ë›Ü›][\Ë[™Y[YšY\œË‚