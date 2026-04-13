require 'xcodeproj'

project_path = File.expand_path('../ios/app.xcodeproj', __dir__)
project = Xcodeproj::Project.open(project_path)

# Clean up orphaned target dependencies in app target
app_target = project.targets.find { |t| t.name == 'app' }

# Remove all existing dependencies (will re-add)
app_target.dependencies.to_a.each do |dep|
  begin
    dep.remove_from_project
  rescue
  end
end

# Remove orphaned PBXTargetDependency objects from the project
project.objects.select { |o| o.isa == 'PBXTargetDependency' }.each do |dep|
  begin
    if dep.target.nil?
      dep.remove_from_project
    end
  rescue
    dep.remove_from_project rescue nil
  end
end

# Remove all PBXContainerItemProxy objects (will be recreated)
project.objects.select { |o| o.isa == 'PBXContainerItemProxy' }.each do |proxy|
  begin
    proxy.remove_from_project
  rescue
  end
end

# Remove embed phases
app_target.copy_files_build_phases.to_a.each do |phase|
  phase.remove_from_project if phase.name == 'Embed App Extensions'
end

project.save
puts "Cleaned orphaned dependencies"

# Re-open fresh
project = Xcodeproj::Project.open(project_path)
app_target = project.targets.find { |t| t.name == 'app' }
widget_target = project.targets.find { |t| t.name == 'RoutineWidget' }

unless widget_target
  puts "RoutineWidget target missing!"
  exit 1
end

# Add dependency and embed
app_target.add_dependency(widget_target)
puts "Added dependency"

embed_phase = app_target.new_copy_files_build_phase('Embed App Extensions')
embed_phase.dst_subfolder_spec = '13'
build_file = embed_phase.add_file_reference(widget_target.product_reference)
build_file.settings = { 'ATTRIBUTES' => ['RemoveHeadersOnCopy'] }
puts "Added embed phase"

project.save
puts "Done!"
