// Voorkomt een extra consolevenster op Windows in release-builds.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    lightning_lib::run();
}
