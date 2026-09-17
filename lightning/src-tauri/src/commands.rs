use std::collections::hash_map::DefaultHasher;
use std::hash::{Hash, Hasher};

#[tauri::command]
pub fn get_app_version(app_handle: tauri::AppHandle) -> String {
    app_handle.package_info().version.to_string()
}

/// Genereert een stabiele, niet-omkeerbare machine-fingerprint op basis van
/// de hostnaam. Wordt meegestuurd bij licentievalidatie zodat een sleutel
/// aan een beperkt aantal toestellen gebonden kan worden (device binding),
/// zonder persoonlijk identificeerbare hardware-informatie te verzenden.
#[tauri::command]
pub fn get_machine_fingerprint() -> String {
    let hostname = hostname_fallback();
    let mut hasher = DefaultHasher::new();
    hostname.hash(&mut hasher);
    format!("{:016x}", hasher.finish())
}

fn hostname_fallback() -> String {
    std::env::var("COMPUTERNAME")
        .or_else(|_| std::env::var("HOSTNAME"))
        .unwrap_or_else(|_| "unknown-host".to_string())
}
