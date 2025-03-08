# fix-all-build-scripts.ps1
# Script to replace Unix-specific commands with cross-platform alternatives in package.json files

Write-Host "Finding all package.json files with Unix-specific commands..."

# Get all package.json files
$allPackageFiles = Get-ChildItem -Path . -Filter "package.json" -Recurse

$updatedCount = 0

foreach ($file in $allPackageFiles) {
    $content = Get-Content -Path $file.FullName -Raw
    
    # Check if file contains "rm -rf"
    if ($content -match "rm -rf") {
        Write-Host "Processing $($file.FullName)..."
        
        # Replace "rm -rf" with "rimraf"
        $updatedContent = $content -replace "rm -rf", "rimraf"
        
        # Write the updated content back to the file
        Set-Content -Path $file.FullName -Value $updatedContent -NoNewline
        
        Write-Host "Updated $($file.FullName)"
        $updatedCount++
    }
}

Write-Host "Updated $updatedCount package.json files to use cross-platform commands."
Write-Host "Note: You'll need to add rimraf as a dependency using:"
Write-Host "yarn add rimraf --dev -W"
Write-Host ""
Write-Host "Cross-platform build script fix complete!"
