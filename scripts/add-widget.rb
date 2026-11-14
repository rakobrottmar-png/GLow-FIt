# Fuegt dem Xcode-Projekt die eigenen Swift-Dateien und das Widget-Ziel hinzu.
# Laeuft im GitHub-Build (macOS) nach "npx cap sync ios". Mehrfaches Ausfuehren ist harmlos.
require 'xcodeproj'

project = Xcodeproj::Project.open('ios/App/App.xcodeproj')
app = project.targets.find { |t| t.name == 'App' } or abort 'Ziel App fehlt'
app_group = project.main_group.children.find { |g| g.respond_to?(:path) && g.path == 'App' } or abort 'Gruppe App fehlt'

def ref_for(group, name)
  group.files.find { |f| f.path == name } || group.new_reference(name)
end

# Swift-Dateien der App (Widget-Plugin, eigener Controller, App Group)
shared = ref_for(app_group, 'AppGroup.swift')
%w[MainViewController.swift WidgetBridgePlugin.swift AppGroup.swift].each do |name|
  ref = ref_for(app_group, name)
  app.add_file_references([ref]) unless app.source_build_phase.files_references.include?(ref)
end
ref_for(app_group, 'App.entitlements')

unless project.targets.any? { |t| t.name == 'GlowUpWidget' }
  widget = project.new_target(:app_extension, 'GlowUpWidget', :ios, '16.0', nil, :swift)
  wgroup = project.main_group.new_group('GlowUpWidget', 'GlowUpWidget')
  widget.add_file_references([wgroup.new_reference('GlowUpWidget.swift'), shared])
  wgroup.new_reference('Info.plist')
  wgroup.new_reference('GlowUpWidget.entitlements')

  widget.build_configurations.each do |c|
    s = c.build_settings
    s['PRODUCT_BUNDLE_IDENTIFIER'] = 'app.glowup.fitness.widget'
    s['PRODUCT_NAME'] = '$(TARGET_NAME)'
    s['INFOPLIST_FILE'] = 'GlowUpWidget/Info.plist'
    s['GENERATE_INFOPLIST_FILE'] = 'NO'
    s['SWIFT_VERSION'] = '5.0'
    s['IPHONEOS_DEPLOYMENT_TARGET'] = '16.0'
    s['TARGETED_DEVICE_FAMILY'] = '1,2'
    s['SKIP_INSTALL'] = 'YES'
    s['MARKETING_VERSION'] = '1.0'
    s['CURRENT_PROJECT_VERSION'] = '1'
    s['APPLICATION_EXTENSION_API_ONLY'] = 'YES'
    s['LD_RUNPATH_SEARCH_PATHS'] = ['$(inherited)', '@executable_path/Frameworks', '@executable_path/../../Frameworks']
  end
  widget.add_system_framework(%w[WidgetKit SwiftUI])

  # Widget in die App einbetten (PlugIns)
  embed = app.new_copy_files_build_phase('Embed Foundation Extensions')
  embed.symbol_dst_subfolder_spec = :plug_ins
  bf = embed.add_file_reference(widget.product_reference, true)
  bf.settings = { 'ATTRIBUTES' => ['RemoveHeadersOnCopy'] }
  app.add_dependency(widget)
end

project.save
puts 'Widget-Ziel und Swift-Dateien im Xcode-Projekt'
