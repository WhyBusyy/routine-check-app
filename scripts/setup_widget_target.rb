require 'xcodeproj'

project_path = File.expand_path('../ios/app.xcodeproj', __dir__)
project = Xcodeproj::Project.open(project_path)

# Clean up any existing widget target and related objects
project.targets.to_a.each do |t|
  t.remove_from_project if t.name == 'RoutineWidget'
end

project.main_group.groups.to_a.each do |g|
  g.remove_from_project if g.name == 'RoutineWidget'
end

# Remove orphaned proxies and dependencies
project.objects.to_a.each do |obj|
  case obj.isa
  when 'PBXTargetDependency'
    if obj.target.nil? || (obj.target.respond_to?(:name) && obj.target.name == 'RoutineWidget')
      obj.remove_from_project rescue nil
    end
  when 'PBXContainerItemProxy'
    if obj.remote_info == 'RoutineWidget'
      obj.remove_from_project rescue nil
    end
  end
end

# Remove embed phases
app_target = project.targets.find { |t| t.name == 'app' }
app_target.copy_files_build_phases.to_a.each do |phase|
  phase.remove_from_project if phase.name == 'Embed App Extensions'
end

# Clean up orphaned dependencies in app target
app_target.dependencies.to_a.each do |dep|
  dep.remove_from_project rescue nil
end

project.save
puts "Cleanup done"

# Re-open
project = Xcodeproj::Project.open(project_path)
app_target = project.targets.find { |t| t.name == 'app' }

# Create widget target
widget_target = project.new_target(:app_extension, 'RoutineWidget', :ios, '15.1')
widget_target.product_type = 'com.apple.product-type.app-extension'

widget_group = project.main_group.new_group('RoutineWidget', 'RoutineWidget')

swift_files = %w[
  ColorExtension.swift
  Models.swift
  Provider.swift
  SmallWidgetView.swift
  MediumWidgetView.swift
  LargeWidgetView.swift
  RoutineWidgetBundle.swift
]

widget_dir = File.expand_path('../ios/RoutineWidget', __dir__)
swift_files.each do |filename|
  full_path = File.join(widget_dir, filename)
  next unless File.exist?(full_path)
  file_ref = widget_group.new_reference(filename)
  widget_target.source_build_phase.add_file_reference(file_ref)
end

widget_group.new_reference('Info.plist')

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

# Manually create dependency (avoid buggy add_dependency)
container_proxy = project.new(Xcodeproj::Project::Object::PBXContainerItemProxy)
container_proxy.container_portal = project.root_object.uuid
container_proxy.proxy_type = '1'
container_proxy.remote_global_id_string = widget_target.uuid
container_proxy.remote_info = 'RoutineWidget'

target_dep = project.new(Xcodeproj::Project::Object::PBXTargetDependency)
target_dep.name = 'RoutineWidget'
target_dep.target = widget_target
target_dep.target_proxy = container_proxy

app_target.dependencies << target_dep
puts "Added manual dependency"

# Embed phase
embed_phase = app_target.new_copy_files_build_phase('Embed App Extensions')
embed_phase.dst_subfolder_spec = '13'
build_file = embed_phase.add_file_reference(widget_target.product_reference)
build_file.settings = { 'ATTRIBUTES' => ['RemoveHeadersOnCopy'] }
puts "Added embed phase"

# Bridge files
existing_names = app_target.source_build_phase.files.map { |f| f.file_ref&.name || f.file_ref&.path }.compact

unless existing_names.include?('WidgetKitBridge.swift')
  app_group = project.main_group.groups.find { |g| g.name == 'app' }
  ref = app_group.new_reference('app/WidgetKitBridge.swift')
  ref.name = 'WidgetKitBridge.swift'
  app_target.source_build_phase.add_file_reference(ref)
  puts "Added WidgetKitBridge.swift"
end

unless existing_names.include?('WidgetKitBridge.m')
  app_group = project.main_group.groups.find { |g| g.name == 'app' }
  ref = app_group.new_reference('app/WidgetKitBridge.m')
  ref.name = 'WidgetKitBridge.m'
  app_target.source_build_phase.add_file_reference(ref)
  puts "Added WidgetKitBridge.m"
end

project.save
puts "\nDone!"
