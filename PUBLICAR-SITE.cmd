@echo off
chcp 65001 >nul
title Publicando Ao Sindico...
set "SRC=%~dp0"
set "DST=%TEMP%\aosindico-deploy"
set "LOG=%~dp0deploy-ultimo.log"
echo Publicando o site Ao Sindico. Aguarde, leva alguns minutos...
echo [%date% %time%] inicio > "%LOG%"
if exist "%DST%" rmdir /s /q "%DST%"
robocopy "%SRC%." "%DST%" /E /XD .git node_modules .next .pgdata uploads .claude /XF .env *.tsbuildinfo deploy-*.log PUBLICAR-SITE.cmd /NFL /NDL /NJH /NJS /NP >> "%LOG%" 2>&1
cd /d "%DST%"
where vercel >nul 2>&1
if %errorlevel%==0 (
  call vercel deploy --prod --yes >> "%LOG%" 2>&1
) else (
  call npx --yes vercel deploy --prod --yes >> "%LOG%" 2>&1
)
echo [%date% %time%] fim codigo=%errorlevel% >> "%LOG%"
echo.
echo Pronto. Pode fechar esta janela.
timeout /t 15
