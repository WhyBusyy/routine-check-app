require 'xcodeproj'

project_path = File.expand_path('../ios/app.xcodeproj', __dir__)
project = Xcodeproj::Project.open(project_path)

app_target = project.targets.find { |t| t.name == 'app' }
widget_target = project.targets.find { |t| t.name == 'RoutineWidget' }

unless widget_target
  puts "RoutineWidget target not found!"
  exit 1
end

# Remove any existing embed phase
app_target.copy_files_build_phases.each do |phase|
  phase.remove_from_project if phase.name == 'Embed App Extensions'
end

# Remove existing dependency to widget if any
app_target.dependencies.each do |dep|
  if dep.target == widget_target || dep.name == 'RoutineWidget'
    dep.remove_from_project
  end
end

project.save
project = Xcodeproj::Project.open(project_path)
app_target = project.targets.find { |t| t.name == 'app' }
widget_target = project.targets.find { |t| t.name == 'RoutineWidget' }

# Add dependency
app_target.add_dependency(widget_target)
puts "Added dependency"

# Add embed phase
embed_phase = app_target.new_copy_files_build_phase('Embed App Extensions')
embed_phase.dst_subfolder_spec = '13'
build_file = embed_phase.add_file_reference(widget_target.product_reference)
build_file.settings = { 'ATTRIBUTES' => ['RemoveHeadersOnCopy'] }
puts "Added embed phase"

project.save
puts "Done!"
