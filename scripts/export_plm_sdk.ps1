param(
  [string]$Root = 'e:\tedri_project\dev\Plm_Code\PLMSOFT\Server',
  [string]$OutDir = 'e:\tedri_project\dev\Plm_Code\doc\plm-sdk'
)

$ErrorActionPreference = 'Continue'
if (-not (Test-Path $OutDir)) { New-Item -ItemType Directory -Force -Path $OutDir | Out-Null }

# ---- build assembly probe path list ----
$probe = New-Object System.Collections.ArrayList
[void]$probe.Add((Join-Path $Root 'Bin'))
[void]$probe.Add((Join-Path $Root 'Interface'))
Get-ChildItem $Root -Recurse -Directory -ErrorAction SilentlyContinue |
  Where-Object { $_.Name -eq 'Bin' } |
  ForEach-Object { if (-not $probe.Contains($_.FullName)) { [void]$probe.Add($_.FullName) } }
$global:PLMPROBE = $probe.ToArray()
Write-Host ('[probe] ' + $global:PLMPROBE.Count + ' dirs')

# ---- reflection-only dependency resolver ----
$handler = [System.ResolveEventHandler]{
  param($s, $e)
  $n = ($e.Name -split ',')[0]
  foreach ($d in $global:PLMPROBE) {
    $f = Join-Path $d ($n + '.dll')
    if (Test-Path $f) { try { return [Reflection.Assembly]::ReflectionOnlyLoadFrom($f) } catch { } }
  }
  return $null
}
[System.AppDomain]::CurrentDomain.add_ReflectionOnlyAssemblyResolve($handler)

# ---- helpers ----
function Get-ParamSig($m) {
  $parts = New-Object System.Collections.ArrayList
  try {
    foreach ($p in $m.GetParameters()) {
      $tn = '<unresolved>'
      try { $tn = $p.ParameterType.Name } catch { }
      [void]$parts.Add($tn + ' ' + $p.Name)
    }
  } catch { [void]$parts.Add('<unresolved>') }
  return ($parts -join ', ')
}

function Get-RetSig($m) {
  try { return $m.ReturnType.Name } catch { return '?' }
}

function Dump-Assembly($path, $sb) {
  try { $a = [Reflection.Assembly]::ReflectionOnlyLoadFrom($path) }
  catch {
    [void]$sb.AppendLine('## ' + [System.IO.Path]::GetFileName($path))
    [void]$sb.AppendLine('')
    [void]$sb.AppendLine('> LOAD FAILED: ' + $_.Exception.Message)
    [void]$sb.AppendLine('')
    return
  }
  $ts = @()
  try { $ts = @($a.GetTypes()) }
  catch {
    $ie = $_.Exception.InnerException
    if ($ie -and $ie.Types) { $ts = @($ie.Types | Where-Object { $_ }) }
  }
  [void]$sb.AppendLine('## ' + [System.IO.Path]::GetFileName($path))
  [void]$sb.AppendLine('')
  foreach ($t in $ts) {
    if ($null -eq $t) { continue }
    if ($t.FullName -like '*<*') { continue }
    $vis = $false
    try { $vis = ($t.IsPublic -or $t.IsNestedPublic) } catch { }
    if (-not $vis) { continue }

    $kind = 'class'
    if ($t.IsInterface) { $kind = 'interface' }
    elseif ($t.IsEnum) { $kind = 'enum' }

    [void]$sb.AppendLine('### [' + $kind + '] ' + $t.FullName)

    if ($t.IsEnum) {
      try {
        $names = [Enum]::GetNames($t)
        [void]$sb.AppendLine('- values: ' + ($names -join ', '))
      } catch { }
      [void]$sb.AppendLine('')
      continue
    }

    $ms = @()
    try { $ms = @($t.GetMethods('Public,Instance,Static,DeclaredOnly')) } catch { }
    $count = 0
    foreach ($m in $ms) {
      if ($m.Name.StartsWith('get_') -or $m.Name.StartsWith('set_')) { continue }
      if ($m.Name -eq 'Equals' -or $m.Name -eq 'GetHashCode' -or $m.Name -eq 'ToString' -or $m.Name -eq 'GetType') { continue }
      [void]$sb.AppendLine('- `' + (Get-RetSig $m) + ' ' + $m.Name + '(' + (Get-ParamSig $m) + ')`')
      $count++
    }
    if ($count -eq 0) { [void]$sb.AppendLine('- (no public methods)') }
    [void]$sb.AppendLine('')
  }
}

# ---- 01 Interface contracts ----
Write-Host '[1/5] Interface contracts ...'
$sb = New-Object System.Text.StringBuilder
[void]$sb.AppendLine('# PLM SDK - Interface Contracts')
[void]$sb.AppendLine('')
[void]$sb.AppendLine('> Auto-generated. Source: `Server\Interface\*.dll` (official note: "all model and business object interface dlls")')
[void]$sb.AppendLine('')
$ifs = Get-ChildItem (Join-Path $Root 'Interface') -Filter *.dll -ErrorAction SilentlyContinue | Sort-Object Name
foreach ($f in $ifs) { Dump-Assembly $f.FullName $sb }
$sb.ToString() | Out-File -FilePath (Join-Path $OutDir '01-interface-sdk.md') -Encoding UTF8
Write-Host ('     dll=' + $ifs.Count)

# ---- 02 Service / WebService (callable data services) ----
Write-Host '[2/5] Service / WebService ...'
$sb = New-Object System.Text.StringBuilder
[void]$sb.AppendLine('# PLM Callable Services (DataService)')
[void]$sb.AppendLine('')
[void]$sb.AppendLine('> Auto-generated. Source: all `*Service.dll` / `*WebService.dll` under `Server\`.')
[void]$sb.AppendLine('> Call pattern: `HoteamUI.DataService.Call("<Namespace>.<Class>.<Method>", { para: ... })`')
[void]$sb.AppendLine('')
$svcs = Get-ChildItem $Root -Recurse -Filter *.dll -ErrorAction SilentlyContinue |
  Where-Object { $_.Name -like '*Service.dll' -or $_.Name -like '*WebService.dll' } |
  Where-Object { $_.FullName -notlike '*webkit*' } |
  Sort-Object FullName
foreach ($f in $svcs) { Dump-Assembly $f.FullName $sb }
$sb.ToString() | Out-File -FilePath (Join-Path $OutDir '02-service-api.md') -Encoding UTF8
Write-Host ('     dll=' + $svcs.Count)

# ---- 03 Plugin extension points ----
Write-Host '[3/5] Plugin points ...'
$sb = New-Object System.Text.StringBuilder
[void]$sb.AppendLine('# PLM Plugin Extension Points')
[void]$sb.AppendLine('')
[void]$sb.AppendLine('> Auto-generated from all `*.plugin` / `*.flowplugin` files.')
[void]$sb.AppendLine('')
$plugs = Get-ChildItem $Root -Recurse -Include *.plugin, *.flowplugin -ErrorAction SilentlyContinue | Sort-Object FullName
$total = 0
foreach ($f in $plugs) {
  $txt = Get-Content -Path $f.FullName -Raw -ErrorAction SilentlyContinue
  if (-not $txt) { continue }
  $hits = [regex]::Matches($txt, '<Plugin(?:Item)?\s+[^>]*?/?>')
  if ($hits.Count -eq 0) { continue }
  [void]$sb.AppendLine('## ' + $f.FullName.Replace($Root, 'Server'))
  [void]$sb.AppendLine('')
  foreach ($h in $hits) {
    $raw = $h.Value
    $name = ''
    $type = ''
    $asm = ''
    $cls = ''
    $m = [regex]::Match($raw, 'Name\s*=\s*"([^"]*)"'); if ($m.Success) { $name = $m.Groups[1].Value }
    $m = [regex]::Match($raw, 'Type\s*=\s*"([^"]*)"'); if ($m.Success) { $type = $m.Groups[1].Value }
    $m = [regex]::Match($raw, 'PluginType\s*=\s*"([^"]*)"'); if ($m.Success) { $type = $m.Groups[1].Value }
    $m = [regex]::Match($raw, 'Assembly\s*=\s*"([^"]*)"'); if ($m.Success) { $asm = $m.Groups[1].Value }
    $m = [regex]::Match($raw, 'Class\s*=\s*"([^"]*)"'); if ($m.Success) { $cls = $m.Groups[1].Value }
    if (-not $cls) { continue }
    $cn = [regex]::Match($cls, '\.([^.]+)$')
    [void]$sb.AppendLine('- **' + $name + '** | type=`' + $type + '` | class=`' + $cls + '` | asm=`' + $asm + '`')
    $total++
  }
  [void]$sb.AppendLine('')
}
[void]$sb.AppendLine('---')
[void]$sb.AppendLine('')
[void]$sb.AppendLine('Total plugin entries: ' + $total + ' | Files: ' + $plugs.Count)
$sb.ToString() | Out-File -FilePath (Join-Path $OutDir '03-plugin-points.md') -Encoding UTF8
Write-Host ('     files=' + $plugs.Count + ' entries=' + $total)

# ---- 04 cmdsql command index ----
Write-Host '[4/5] cmdsql command index ...'
$sb = New-Object System.Text.StringBuilder
[void]$sb.AppendLine('# PLM CmdSql Command Index')
[void]$sb.AppendLine('')
[void]$sb.AppendLine('> Auto-generated from all `*.cmdsql`. Call pattern: `<Command Name>` + `[CONDITIONSTR]` placeholder.')
[void]$sb.AppendLine('')
$cmds = Get-ChildItem $Root -Recurse -Filter *.cmdsql -ErrorAction SilentlyContinue | Sort-Object FullName
$cmdTotal = 0
foreach ($f in $cmds) {
  $txt = Get-Content -Path $f.FullName -Raw -ErrorAction SilentlyContinue
  if (-not $txt) { continue }
  $mh = [regex]::Matches($txt, '<Command\s+Name\s*=\s*"([^"]+)"')
  if ($mh.Count -eq 0) { continue }
  [void]$sb.AppendLine('## ' + $f.FullName.Replace($Root, 'Server'))
  [void]$sb.AppendLine('')
  foreach ($h in $mh) {
    [void]$sb.AppendLine('- `' + $h.Groups[1].Value + '`')
    $cmdTotal++
  }
  [void]$sb.AppendLine('')
}
[void]$sb.AppendLine('---')
[void]$sb.AppendLine('')
[void]$sb.AppendLine('Total commands: ' + $cmdTotal + ' | Files: ' + $cmds.Count)
$sb.ToString() | Out-File -FilePath (Join-Path $OutDir '04-cmdsql-index.md') -Encoding UTF8
Write-Host ('     files=' + $cmds.Count + ' commands=' + $cmdTotal)

# ---- 05 config extension types ----
Write-Host '[5/5] config extension types ...'
$src = Join-Path $Root 'Platform\Config\Development.extensiontotype'
if (Test-Path $src) {
  Copy-Item $src (Join-Path $OutDir '05-development-extensiontotype.xml') -Force
  Write-Host '     copied'
} else {
  Write-Host '     MISSING'
}

Write-Host ''
Write-Host ('DONE -> ' + $OutDir)
Get-ChildItem $OutDir | ForEach-Object { Write-Host ('  ' + $_.Name + '  ' + [math]::Round($_.Length / 1024, 1) + ' KB') }
