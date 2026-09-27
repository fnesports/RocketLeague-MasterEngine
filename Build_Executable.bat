@echo off
title FN Pro Rocket League Master Engine - Standalone EXE Compiler
color 0b
echo ==========================================================
echo    FN PRO ROCKET LEAGUE MASTER-ENGINE - EXE BUILDER
echo ==========================================================
echo Compiling native C# WASD hooks into portable .EXE...
echo.

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0Build_MasterEngine_EXE.ps1"

echo.
pause
