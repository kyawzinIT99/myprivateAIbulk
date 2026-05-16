import modal
import subprocess

app = modal.App("antigravity-ai-webhook")

# Build an image with Node.js 20 installed and copy the code inside
image = (
    modal.Image.debian_slim()
    .apt_install("curl")
    .run_commands(
        "curl -fsSL https://deb.nodesource.com/setup_20.x | bash -",
        "apt-get install -y nodejs"
    )
    .add_local_dir(".", remote_path="/app") # Bake code and .env into the image
)

@app.function(image=image)
@modal.web_server(3999, startup_timeout=30)
def antigravity_webhook():
    # Ensure dependencies are installed inside the container
    subprocess.run(["npm", "install"], cwd="/app", check=True)
    
    # Start the Antigravity Orchestrator HTTP Server
    # Popen starts it in the background, which is required by modal.web_server
    subprocess.Popen(["node", "integrations/n8n/server.js"], cwd="/app")
