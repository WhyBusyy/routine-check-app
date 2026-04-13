require 'xcodeproj'

project_path = File.expand_path('../ios/app.xcodeproj', __dir__)
project = Xcodeproj::Project.open(project_path)

# Skip if widget target already exists
if project.targets.any? { |t| t.name == 'RoutineWidget' }
  puts "RoutineWidget target already exists, skipping."
  exit 0
end

# Create widget extension target
widget_target = project.new_target(:app_extension, 'RoutineWidget', :ios, '15.1')
widget_target.product_type = 'com.apple.product-type.app-extension'

# Add Swift source files
widget_dir = File.expand_path('../ios/RoutineWidget', __dir__)
widget_group = project.main_group.new_group('RoutineWidget', 'RoutineWidget')

Dir.glob("#{widget_dir}/*.swift").each do |file_path|
  file_ref = widget_group.new_file(File.basename(file_path))
  widget_target.source_build_phase.add_file_reference(file_ref)
end

# Add Info.plist reference
widget_group.new_file('Info.plist')

# Configure build settings
widget_target.build_configurations.each do |config|
  config.build_settings['PRODUCT_NAME'] = 'RoutineWidget'
  config.build_settings['PRODUCT_BUNDLE_IDENTIFIER'] = 'com.routinecheck.app.RoutineWidget'
  config.build_settings['INFOPLIST_FILE'] = 'RoutineWidget/Info.plist'
  config.build_settings['SWIFT_VERSION'] = '5.0'
  config.build_settings['TARGETED_DEVICE_FAMILY'] = '1'
  config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '15.1'
  config.build_settings['LD_RUNPATH_SEARCH_PATHS'] = '$(inherited) @executable_path/Frameworks @executable_path/../../Frameworks'
  config.build_settings['MARKETING_VERSION'] = '1.0.0'
  config.build_settings['CURRENT_PROJECT_VERSION'] = '1'
  config.build_settings['GENERATE_INFOPLIST_FILE'] = 'NO'
  config.build_settings['CODE_SIGN_ENTITLEMENTS'] = 'RoutineWidget/RoutineWidget.entitlements'
  config.build_settings['SKIP_INSTALL'] = 'YES'
  config.build_settings['WRAPPER_EXTENSION'] = 'appex'

  if config.name == 'Debug'
    config.build_settings['SWIFT_OPTIMIZATION_LEVEL'] = '-Onone'
    config.build_settings['SWIFT_ACTIVE_COMPILATION_CONDITIONS'] = 'DEBUG'
  end
end

# Add dependency and embed
app_target = project.targets.find { |t| t.name == 'app' }
app_target.add_dependency(widget_target)

embed_phase = app_target.new_copy_files_build_phase('Embed App Extensions')
embed_phase.dst_subfolder_spec = '13'
build_file = embed_phase.add_file_reference(widget_target.product_reference)
build_file.settings = { 'ATTRIBUTES' => ['RemoveHeadersOnCopy'] }

# Add bridge files to main app target
app_group = project.main_group.groups.find { |g| g.name == 'app' }

swift_ref = app_group.new_file('app/WidgetKitBridge.swift')
swift_ref.name = 'WidgetKitBridge.swift'
app_target.source_build_phase.add_file_reference(swift_ref)

m_ref = app_group.new_file('app/WidgetKitBridge.m')
m_ref.name = 'WidgetKitBridge.m'
app_target.source_build_phase.add_file_reference(m_ref)

project.save
puts "Successfully added RoutineWidget target + bridge files!"
