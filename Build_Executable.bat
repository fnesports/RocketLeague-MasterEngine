@echo off
title FN Pro Rocket League Master Engine - Standalone GUI EXE Compiler
color 0b
echo ==========================================================
echo    FN PRO ROCKET LEAGUE MASTER-ENGINE - GUI EXE BUILDER
echo ==========================================================
echo Generating custom "FN" icon and compiling standalone GUI Window...
echo.

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0Build_MasterEngine_EXE.ps1"

echo.
pause
