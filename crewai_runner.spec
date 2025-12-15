# -*- mode: python ; coding: utf-8 -*-
from PyInstaller.utils.hooks import collect_all

datas = [('backend/llm-feature/crew-ai-agent-iteration/calendar_interaction/src/calendar_interaction/config', 'calendar_interaction/config')]
binaries = []
hiddenimports = ['tools', 'tools.sqlite_tool']
tmp_ret = collect_all('crewai')
datas += tmp_ret[0]; binaries += tmp_ret[1]; hiddenimports += tmp_ret[2]


a = Analysis(
    ['backend/llm-feature/crew-ai-agent-iteration/calendar_interaction/src/calendar_interaction/crewai_runner.py'],
    pathex=['backend/llm-feature/crew-ai-agent-iteration/calendar_interaction/src', 'backend/llm-feature/crew-ai-agent-iteration/calendar_interaction/src/calendar_interaction'],
    binaries=binaries,
    datas=datas,
    hiddenimports=hiddenimports,
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    noarchive=False,
    optimize=0,
)
pyz = PYZ(a.pure)

exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name='crewai_runner',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    console=True,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)
coll = COLLECT(
    exe,
    a.binaries,
    a.datas,
    strip=False,
    upx=True,
    upx_exclude=[],
    name='crewai_runner',
)
