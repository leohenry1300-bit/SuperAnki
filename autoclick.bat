<# :
@echo off
title AutoClick - M = ON/OFF, Echap = quitter
powershell -NoProfile -ExecutionPolicy Bypass -Command "iex ((Get-Content -LiteralPath '%~f0') -join [Environment]::NewLine)"
exit /b
#>

Add-Type @"
using System;
using System.Runtime.InteropServices;
using System.Threading;

public static class AutoClick {
    [DllImport("user32.dll")] static extern void mouse_event(int f, int x, int y, int d, int e);
    [DllImport("user32.dll")] static extern short GetAsyncKeyState(int k);

    const int LEFTDOWN = 0x02, LEFTUP = 0x04;
    const int KEY_M = 0x4D, KEY_ESC = 0x1B;

    static bool Down(int k) { return (GetAsyncKeyState(k) & 0x8000) != 0; }

    public static void Run(int delayMs) {
        bool on = false, wasM = false;
        Console.WriteLine("AutoClick pret. M = activer/desactiver, Echap = quitter.");
        while (!Down(KEY_ESC)) {
            bool m = Down(KEY_M);
            if (m && !wasM) {
                on = !on;
                Console.WriteLine(on ? "[ON]  clic en cours..." : "[OFF] en pause");
            }
            wasM = m;
            if (on) {
                mouse_event(LEFTDOWN, 0, 0, 0, 0);
                mouse_event(LEFTUP, 0, 0, 0, 0);
            }
            Thread.Sleep(on ? delayMs : 10);
        }
        Console.WriteLine("Fin.");
    }
}
"@

# Delai entre les clics en millisecondes (1 = tres rapide)
[AutoClick]::Run(1)
