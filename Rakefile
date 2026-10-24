task default: %w[serve]

namespace :dnd do
  desc 'Build the DND application into the generated dnd/ directory'
  task :build do
    sh 'npm', '--prefix', 'apps/dnd', 'run', 'build'
  end

  desc 'Run the DND application tests'
  task :test do
    sh 'npm', '--prefix', 'apps/dnd', 'test'
  end
end

desc 'Build DND and serve the complete Jekyll website'
task serve: 'dnd:build' do
  sh 'bundle', 'exec', 'jekyll', 'serve', '-w'
end

task :deploy do
  sh 'git push dokku master'
end

namespace :assets do
  desc 'Build both applications for production'
  task precompile: 'dnd:build' do
    sh 'bundle', 'exec', 'jekyll', 'build'
  end
end
