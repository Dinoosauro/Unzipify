// Register service worker
if ('serviceWorker' in navigator) {
    let registration;
    const registerServiceWorker = async () => {
        registration = await navigator.serviceWorker.register('./service-worker.js',);
    };
    registerServiceWorker();
}
let appVersion = "1.0.0";
fetch("https://dinoosauro.github.io/UpdateVersion/unzipify-updatecode", { cache: "no-store" }).then((res) => res.text().then((text) => { if (text.replace("\n", "") !== appVersion) if (confirm(`There's a new version of Unzipify. Do you want to update? [${appVersion} --> ${text.replace("\n", "")}]`)) { caches.delete("unzipify-cache"); location.reload(true); } }).catch((e) => { console.error(e) })).catch((e) => console.error(e)); // Look for the latest version code and, if it's not the same as the current appVersion, ask the user to update
document.getElementById("versionId").textContent = appVersion;
let zip = new JSZip(); // Create new JSZip item
let totalFiles = []; // An array that will contain each file of the .zip one
let folderSuccessionLoaded = { // An object that will contain specific information about files
    items: [], // It'll be an object with the curernt path
    ref: "", // The current position in the ZIP folder structure
    nextRef: [], // An array with the previous path (when the user clicks the "Back button") 
    nextStruct: [], // An array with the previous structure number (when the user clicks the "Back button") 
    structure: 0, // The number of subfolders explored by the user
    container: { // For lazy loading in the zip explorer
        nextLoadItems: [],
        prevLoadItems: [],
        currentItems: [],
    },
    search: { // For lazy loading in the search function
        nextLoadItems: [],
        prevLoadItems: [],
        currentItems: [],
    },
    position: "left", // If the next ZIP file should be appended at the left or at the right
    isNew: false
};
document.getElementById("startNew").addEventListener("click", () => { // Creates a new JSZIP file
    folderSuccessionLoaded.isNew = true;
    document.getElementById("introduction").style.opacity = 0;
    setTimeout(() => {
        // Display toolbar
        document.getElementById("introduction").style.display = "none";
        document.getElementById("toolbar").style.display = "flex";
        setTimeout(() => { generateHover() }, 150); // Add hover effects
        setTimeout(() => { document.getElementById("toolbar").style.opacity = "1" }, 15);
    }, 250);
})
document.getElementById("fileBtn").addEventListener("click", () => { // Choose a zip file and open it
    let input = document.createElement("input");
    input.type = "file";
    input.addEventListener("change", () => {
        document.getElementById("fileSpinner").style.display = "block"; // Display a spinner while zip-read is reading the file
        let file = new FileReader();
        file.addEventListener("load", () => {
            zip.loadAsync(file.result).then((fileArray) => { // Read the zip file
                document.getElementById("introduction").style.opacity = 0;
                totalFiles = fileArray.files; // Set totalFiles an the array with all the zip files
                setTimeout(() => {
                    // Display the toolbar
                    document.getElementById("introduction").style.display = "none";
                    document.getElementById("toolbar").style.display = "flex";
                    setTimeout(() => { generateHover() }, 150); // Add hover effect
                    setTimeout(() => { document.getElementById("toolbar").style.opacity = "1" }, 15);
                    improvedReader(); // Read the zip file and generate the lazy loading items
                }, 250);
            });
        });
        file.readAsArrayBuffer(input.files[0]);
    })
    input.click();
});
function improvedReader() {
    let fetchKeys = Object.keys(totalFiles); // Get the file name of each file
    for (let i = 0; i < fetchKeys.length; i++) {
        if (typeof (folderSuccessionLoaded.items[fetchKeys[i].split("/").length - 1]) === "undefined") folderSuccessionLoaded.items[fetchKeys[i].split("/").length - 1] = []; // If the items array (that divides each item per folder structure) doesn't have the current subfolder strucutre number (1 if the item is in a folder, 2 if the item is in a sbufolder of a folder etc.), create a new array with that number
        folderSuccessionLoaded.items[fetchKeys[i].split("/").length - 1].push(fetchKeys[i]); // Push the item name to the structure array
    }
    document.getElementById("fileSpinner").style.display = "none"; // Finished reading zip file
    showItems(); // Start showing the file name & options in the container
}
function getIfSameFolder(path, isFolder) { // Function that folder path of the passed item
    if (isFolder) path = path.substring(0, path.lastIndexOf("/"));
    path = path.substring(0, path.lastIndexOf("/"));
    return path;
}
function deleteAccidentalSlash(item) { // Delete the final slash (especially for folders)
    if (item.endsWith("/")) return item.substring(0, item.lastIndexOf("/"));
    return item;
}
function showItems() { // The function that looks for the items to add to the container div
    let itemCount = 0; // Limit of 50 items
    if (folderSuccessionLoaded.items[folderSuccessionLoaded.structure + 1] !== undefined) for (let lookFolder of folderSuccessionLoaded.items[folderSuccessionLoaded.structure + 1]) if (lookFolder.endsWith("/") && getIfSameFolder(lookFolder, true) === deleteAccidentalSlash(folderSuccessionLoaded.ref)) { if (itemCount < 50) createBtn(readyValue(lookFolder), lookFolder, true); else folderSuccessionLoaded["container"].nextLoadItems.push([lookFolder, true]); itemCount++ } // If there are any possible subfolders, look if the folder path is the same and, if yes, dispaly them as folder
    if (folderSuccessionLoaded.items[folderSuccessionLoaded.structure] !== undefined) for (let lookFile of folderSuccessionLoaded.items[folderSuccessionLoaded.structure]) if (getIfSameFolder(lookFile, false) === deleteAccidentalSlash(folderSuccessionLoaded.ref) && deleteAccidentalSlash(lookFile) !== deleteAccidentalSlash(folderSuccessionLoaded.ref)) { if (itemCount < 50) createBtn(readyValue(lookFile), lookFile, false); else folderSuccessionLoaded["container"].nextLoadItems.push([lookFile, false]) }; // If the file in the same structure are in the same folder, display them
}
let containerId = document.getElementById("fileContainer");
function scrollLogic(container, connection, search) { // The function that manages lazy loading. 
    // container) the item to apply the lazy loading
    // connection) the key in the folderSuccessionLoaded where the new items should be added (ex: container, search)
    // search) if the user is using the search function or not
    let percentage = Math.round((container.scrollTop / (container.scrollHeight - container.offsetHeight)) * 100); // Get the percentage of scroll
    if (percentage > 90) { // Load next items
        let getMaxScroll = 25; // Default more items loading
        if (getMaxScroll > folderSuccessionLoaded[connection].nextLoadItems.length) getMaxScroll = folderSuccessionLoaded[connection].nextLoadItems.length; // If there are fewer than 25 items, change it
        for (let i = 0; i < getMaxScroll; i++) {
            if (folderSuccessionLoaded[connection].currentItems[i] !== undefined) { // If the currentItem at that position exists, delete it and push it to the previous loaded items
                container.firstChild.remove();
                folderSuccessionLoaded[connection].prevLoadItems.push(folderSuccessionLoaded[connection].currentItems[0]);
                folderSuccessionLoaded[connection].currentItems.splice(0, 1);
            }
            createBtn(readyValue(folderSuccessionLoaded[connection].nextLoadItems[i][0]), folderSuccessionLoaded[connection].nextLoadItems[i][0], folderSuccessionLoaded[connection].nextLoadItems[i][1], undefined, search); // Create a new file div
        }
        folderSuccessionLoaded[connection].nextLoadItems.splice(0, getMaxScroll); // Delete the shown item from the nextLoad item
    } else if (percentage < 10) { // Load previous items
        let getMinScroll = 25; // Default more items loading
        if (getMinScroll > folderSuccessionLoaded[connection].prevLoadItems.length) getMinScroll = folderSuccessionLoaded[connection].prevLoadItems.length; // If there aren't as many items to add
        for (let i = 0; i < getMinScroll; i++) {
            let containers = container.childNodes;
            if (containers.length !== 0) { // If there's at least a file div to delete, delete it and add it to the items to load next
                containers[containers.length - 1].remove();
                folderSuccessionLoaded[connection].nextLoadItems.unshift(folderSuccessionLoaded[connection].currentItems[containers.length - 1]);
                folderSuccessionLoaded[connection].currentItems.splice(containers.length - 1, 1);
            }
            createBtn(readyValue(folderSuccessionLoaded[connection].prevLoadItems[folderSuccessionLoaded[connection].prevLoadItems.length - i - 1][0]), folderSuccessionLoaded[connection].prevLoadItems[folderSuccessionLoaded[connection].prevLoadItems.length - i - 1][0], folderSuccessionLoaded[connection].prevLoadItems[folderSuccessionLoaded[connection].prevLoadItems.length - i - 1][1], true, search); // Create a new file div, adding it at the top of the item
        }
        folderSuccessionLoaded[connection].prevLoadItems.splice(folderSuccessionLoaded[connection].prevLoadItems.length - getMinScroll, getMinScroll);
    }
}
containerId.addEventListener("scroll", () => { // Add lazy loading for scrolling the container
    scrollLogic(containerId, "container")
});
document.getElementById("searchContent").addEventListener("scroll", () => { // Add lazy loading for the search scroll
    scrollLogic(document.getElementById("searchContent"), "search", true);
});
let mediaContainer = { // An object that contains the file zip-read is able to generate a preview
    video: {
        extension: ["mp4", "mov", "ogg", "webm", "ts"], // Extension to look
        containerFormat: document.createElement("video"), // The item to use for displaying it
        indexType: "src" // Where the link should be added
    },
    audio: {
        extension: ["flac", "mp3", "opus", "wav", "aac", "m4a", "alac", "weba"],
        mimeRefer: ["audio/flac", "audio/mpeg", "audio/opus", "audio/wav", "audio/aac", "audio/aac", "audio/aac", "audio/webm"],
        containerFormat: document.createElement("audio"),
        indexType: "src",
        askType: "audio/*",
    },
    image: {
        extension: ["avif", "gif", "jpeg", "jpg", "jfif", "png", "svg", "webp", "bmp", "ico", "heic", "heif"],
        containerFormat: document.createElement("img"),
        indexType: "src"
    },
    markdown: {
        extension: ["md"],
        containerFormat: document.createElement("div"),
        indexType: "innerHTML"
    },
    code: {
        extension: ["js", "html", "css", "py", "cpp", "cs", "applescript", "bat", "c", "ino", "erb", "go", "kt", "lua", "o", "php", "pl", "ps1", "rb", "rs", "vb", "vba", "vbs", "spct", "xml", "sh", "java", "json", "vbproj", "vdproj", "vcproj", "csproj", "xaml", "swift"],
        containerFormat: document.createElement("div"),
        indexType: "innerHTML"
    },
    pdf: {
        extension: ["pdf"],
        containerFormat: document.createElement("canvas"),
        indexType: "pdf"
    }
}
document.querySelector("[data-action=back]").addEventListener("click", () => { // Go to previous folder
    if (document.querySelector("[data-fetch=prev]").classList.contains("disabled")) return; // If the icon disabled, the user is at the root folder, so there's no sense to continue scrolling backwards
    folderSuccessionLoaded["container"].nextLoadItems = []; // Delete the items to load next, since it's a new structure
    // Add the previous folder to the "Next items" arrays
    folderSuccessionLoaded.nextRef.unshift(folderSuccessionLoaded.ref);
    folderSuccessionLoaded.nextStruct.unshift(folderSuccessionLoaded.structure);
    document.querySelector("[data-fetch=next]").classList.remove("disabled"); // Since the user has gone back, they should be able also to go to the previous folder (so to the next folder)
    if (folderSuccessionLoaded.ref.split("/").length <= 2) { // If it's a root folder
        folderSuccessionLoaded.ref = "";
        folderSuccessionLoaded.structure = 0;
        document.querySelector("[data-fetch=prev]").classList.add("disabled"); // There's nothing to go back
        containerId.innerHTML = "";
    } else { // There are other folders "above" the current one
        folderSuccessionLoaded.ref = folderSuccessionLoaded.ref.substring(0, folderSuccessionLoaded.ref.length - 1);
        folderSuccessionLoaded.ref = folderSuccessionLoaded.ref.substring(0, folderSuccessionLoaded.ref.lastIndexOf("/"));
        folderSuccessionLoaded.structure--;
        containerId.innerHTML = "";
    }
    cleanItems(); // Delete objects that are tied to a single folder session
    showItems(); // Show the items in the "new" folder
})
function cleanItems(search) { // Delete objects that are tied to a single folder "exploration"
    folderSuccessionLoaded.position = "left";
    let containerType = search ? "search" : "container";
    folderSuccessionLoaded[containerType].currentItems = [];
    folderSuccessionLoaded[containerType].nextLoadItems = [];
    folderSuccessionLoaded[containerType].prevLoadItems = [];
}
let fetchAssets; // The object that will contain all the SVGs of the img assets
fetch("./assets/mergedAssets.json").then((res) => { res.json().then((json) => { fetchAssets = json }).catch((ex) => { console.error(ex) }) }).catch((ex) => { console.error(ex) }); // Fetch the JSON file that contains all of them
function getImg(icon, item, customColor) { // The function that will add the SVG icon to the images
    if (fetchAssets === undefined) { // The fetch request hasn't finished yet, so let's retry after 150 seconds
        setTimeout(() => getImg(icon, item, customColor), 150); 
        return;
    }
    if (fetchAssets[icon] === undefined) { // Can't find icon, fallback to default "document" icon
        console.warn(`Icon not found: ${icon}`);
        icon = "document";
    }
    let itemColor = getComputedStyle(document.body).getPropertyValue("--accent"); // Get the accent color for the icon
    if (customColor !== undefined) itemColor = customColor; else item.setAttribute("data-fetch", icon); // If it must be a custom color (ex: for the theme colors), change the itemColor variable. Otherwise, add a data-fetch attribute that will be used when chaning theme (so that the icons that are tied to the accent color can change their color)
    item.src = URL.createObjectURL(new Blob([fetchAssets[icon].replaceAll("#212121", itemColor)], { type: "image/svg+xml" }));
    addHoverEvents(item); // Add brightness effect when hovering
}
let PDFUtil = [null, 1, document.createElement("canvas"), 1]; // An array with [The PDF element, the page number, the canvas with full zoom, the scale of the output file]
let urlAdd = [];
function getOptionalLibraries(url) { // Load optional libraries required for viewing certain files (ex: Markdown.js or PDF.js)
    return new Promise((resolve, reject) => {
        if (urlAdd.indexOf(url) !== -1) resolve("");
        urlAdd.push(url);
        let contentLoader = document.createElement("script");
        contentLoader.src = url
        contentLoader.setAttribute("crossorigin", "anonymous");
        contentLoader.onload = () => {
            resolve("");
        }
        document.body.append(contentLoader);
    });
}
function addAnimation(item, reverse) { // Add dialog animation
    if (typeof (item) === "string") item = document.getElementById(item);
    item.style.opacity = "1";
    item.style.display = "block";
    if (!reverse) item.classList.add("displayDialog"); else item.classList.add("revDisplayDialog");
}
function previewHandler(value, imgIcon) { // The function that manages the preview dialog
    if (value.endsWith("pdf")) document.getElementById("pdfControlContainer").style.display = "flex"; else document.getElementById("pdfControlContainer").style.display = "none"; // If it's a PDF, show the control toolbar (next/previous page), otherwise hide it
    document.getElementById("fileSpinner").style.display = "block"; // Show the loading spinner until the website hasn't finished loading
    if (document.getElementById("jsMediaContainer").firstChild !== null) URL.revokeObjectURL(document.getElementById("jsMediaContainer").firstChild.src); // Delete the blob of the previous previewed resource
    document.getElementById("jsMediaContainer").innerHTML = ""; // Delete every item that there could be there
    addAnimation("previewDialog", document.getElementById("previewDialog").style.top === ""); // Show and add an animation to the dialog
    let fetchElement = mediaContainer[imgIcon].containerFormat; // Get the HTML element to create for this preview
    document.getElementById("fileName").textContent = value; // Set the file name
    zip.file(value).async("arraybuffer").then(async (buffer) => { // Fetch the file to preview
        switch (mediaContainer[imgIcon].indexType) { // Look at the type of preview to handle it
            case "src": // Probably video or audio, so add controls
                fetchElement.setAttribute("controls", "");
                fetchElement.classList.add("contentRespect");
                document.getElementById("fileSpinner").style.display = "none";
                if (mediaContainer[imgIcon].askType !== undefined) { // askType: some browsers (WebKit) requires to add a mimetype to load audio. So, if it exists, add it.
                    switch (mediaContainer[imgIcon].askType) {
                        case "audio/*":
                            fetchElement.src = URL.createObjectURL(new Blob([buffer], { type: mediaContainer.audio.mimeRefer[mediaContainer.audio.extension.indexOf(value.substring(value.lastIndexOf(".") + 1))] }));
                            break;
                    }
                    document.getElementById("fileSpinner").style.display = "none";
                } else {
                    switch (value.substring(value.lastIndexOf(".") + 1)) { // Get final extension
                        case "svg": // Just like with audio, with SVG images basically every browser needs to have a mimetype
                            fetchElement.src = URL.createObjectURL(new Blob([buffer], { type: "image/svg+xml" }));
                            document.getElementById("fileSpinner").style.display = "none";
                            break;
                        case "heif": case "heic": // For HEIC images, load an external library that will render them
                            await getOptionalLibraries("./heic2any.js");
                            let blob = new Blob([buffer]);
                            heic2any({ blob }).then((blobResult) => { fetchElement.src = URL.createObjectURL(blobResult); document.getElementById("fileSpinner").style.display = "none"; });
                            break;
                        default: // Just append set the source
                            fetchElement.src = URL.createObjectURL(new Blob([buffer]));
                            document.getElementById("fileSpinner").style.display = "none";
                            break;
                    }
                }
                break;
            case "innerHTML": // Add content as innerHTML or textContent (ex: files that are readable by a text editor)
                fetchElement.classList.add("textPreview");
                if (value.substring(value.lastIndexOf(".") + 1) === "md") { // For Markdown files, load the markdown-it external library and render it.
                    await getOptionalLibraries("https://cdn.jsdelivr.net/npm/markdown-it@13.0.1/dist/markdown-it.min.js");
                    let md = window.markdownit();
                    fetchElement.innerHTML = md.render(new TextDecoder().decode(new Uint8Array(buffer)));
                } else { // To avoid code injection, use textContent with white-space for preserving new lines
                    fetchElement.style = "white-space: pre";
                    fetchElement.textContent = (new TextDecoder().decode(new Uint8Array(buffer)));
                }
                document.getElementById("fileSpinner").style.display = "none";
                break;
            case "pdf": // With PDFs, load the PDFjs library and render them
                await getOptionalLibraries("https://cdn.jsdelivr.net/npm/pdfjs-dist@3.9.179/build/pdf.min.js");
                fetchElement.id = "pdfCanvas";
                fetchElement.style = "width: 100%; height: auto; border-radius: 8px;"
                let pdfFetch = pdfjsLib.getDocument(buffer);
                pdfFetch.promise.then((pdf) => {
                    PDFUtil[0] = pdf;
                    PDFExtract();
                })
        }
        document.getElementById("jsMediaContainer").append(fetchElement);
    });
}
document.querySelector("[data-action=prevPage]").addEventListener("click", () => { // Go to the previous page of the PDF
    if (PDFUtil[1] === 1) return;
    PDFUtil[1]--;
    PDFExtract();
});
document.querySelector("[data-action=nextPage]").addEventListener("click", () => { // Go to the next page of the PDF
    PDFUtil[1]++;
    PDFExtract();
});
function PDFExtract() { // The function that creates the PDF
    let canvas = document.getElementById("pdfCanvas");
    PDFUtil[0].getPage(PDFUtil[1]).then((page) => { // Get the PDF page to view
        let viewport = page.getViewport({ scale: PDFUtil[3], }); // Setup the PDF scale
        let outputScale = window.devicePixelRatio || 1; 
        if (PDFUtil[3] !== 1) canvas.style = `width: ${viewport.width}px; height: ${viewport.height}px; overflow: scroll; border-radius: 8px;`; else "width: 100%; height: auto; border-radius: 8px;"; // If the width is 1, there's no need to change the canvas size. Otherwise, it's necessary to change it to the viewport one so that the user can scroll the PDF canvas
        canvas.width = Math.floor(viewport.width * outputScale);
        canvas.height = Math.floor(viewport.height * outputScale);
        let transform = outputScale !== 1
            ? [outputScale, 0, 0, outputScale, 0, 0]
            : null;

        let renderContext = {
            canvasContext: canvas.getContext("2d"),
            transform: transform,
            viewport: viewport
        };
        page.render(renderContext);
        document.getElementById("fileSpinner").style.display = "none";
    }).catch((ex) => { // If there are any issues, go back to previous page
        console.warn(ex);
        document.querySelector("[data-action=prevPage]").click();
    })
}
function moveDialog(dialogName, preview, contentImg) { // The function that manages where a dialog should appear
    document.getElementById(dialogName).style.marginLeft = "20vw";
    document.getElementById(dialogName).style.position = "absolute";
    for (let item of ["top", "left", "right", "bottom"]) document.getElementById(dialogName).style[item] = ""; // Replace any position absolute attribute
    if (preview.getBoundingClientRect().y < document.body.offsetHeight * 60 / 100) document.getElementById(dialogName).style.top = `${preview.getBoundingClientRect().top + 15}px`; else document.getElementById(dialogName).style.bottom = `${preview.getBoundingClientRect().bottom + 15}px`; // If there's enough space, use the top property. Otherwise,use the bottom property. Same for left/right below.
    if (contentImg.getBoundingClientRect().left < document.body.offsetWidth * 40 / 100) document.getElementById(dialogName).style.left = `${contentImg.getBoundingClientRect().left + 15}px`; else document.getElementById(dialogName).style.right = `${contentImg.getBoundingClientRect().right - contentImg.getBoundingClientRect().left + 15}px`;

}
function createBtn(contentName, value, isFolder, prepend, searchAppend) { // The function that creates the container for each file
    let btnContainer = document.createElement("div");
    btnContainer.classList.add("btnContainer");
    if (!searchAppend) { // With search, each item has its own row. Otherwise, an item will be added at the left, and another at the right
        if (folderSuccessionLoaded.position === "left") { btnContainer.classList.add("rightMargin"); folderSuccessionLoaded.position = "right"; } else { btnContainer.classList.add("leftMargin"); folderSuccessionLoaded.position = "left"; }
    } else btnContainer.style = "width: 100%";
    let leftBtnName = document.createElement("div");
    leftBtnName.classList.add("leftContent");
    let leftText = document.createElement("l");
    leftText.style = "max-height: 30px; overflow: scroll;";
    leftText.textContent = contentName;
    let contentImg = document.createElement("img");
    contentImg.style = "width: 28px; height: 28px; margin-right: 10px; cursor: auto";
    let imgIcon = isFolder ? "folder" : "document";
    // Sources: https://emulation.fandom.com/wiki/List_of_filetypes | https://en.wikipedia.org/wiki/List_of_file_formats | My knowledge
    let generalFormatDefinition = { // An array of file extension to add custom icons. The keys are all icon names.
        slide: ["ppt", "pptx", "potx", "pot", "odt", "pps", "ppsx", "pptm", "potm", "ppsm", "key"],
        sheet: ["xlsx", "xls", "csv", "xltx", "xlt", "xlsm", "xlsb", "xltm", "prn", "ods", "numbers"],
        docs: ["doc", "docx", "rtf", "txt", "dotx", "dot", "docm", "dotm", "odt", "pages"],
        pdf: ["pdf", "xls"],
        app: ["exe", "dmg", "apk", "app", "dll", "class", "elf", "jar", "ipa", "appx", "msix", "msi", "bin"],
        folderzip: ["zip", "7z", "gz", "tar", "rar", "bin", "lz", "lzma", "xz", "iso", "apfs"],
        font: ["ttf", "otf", "abf", "ttc", "woff", "woff1", "woff2"],
        gaming: ["wbfs", "wad", "wdf", "gcm", "nds", "dsi", "3ds", "cia", "gb", "gbc", "gba", "n64", "nes", "fds", "sms", "smd", "smc", "078", "sfc", "fig", "npc", "ngp", "ngc", "pss", "mca", "nbt", "map", "osr", "osu", "ecm", "cso", "cdi", "gdi", "gen", "gcz", "ps2", "mcr", "mpk", "cg", "glsl", "hlsl"],
        image: ["tiff", "tif", "heic", "heif", "avif", "jxr", "jp2", "wmf", "odg", "cdr", "ai", "dxf", "heic", "heif", "avif", "gif", "jpeg", "jpg", "jfif", "png", "svg", "webp", "bmp", "ico"],
        code: ["js", "html", "css", "py", "cpp", "cs", "applescript", "bat", "c", "ino", "erb", "go", "kt", "lua", "o", "php", "pl", "ps1", "rb", "rs", "vb", "vba", "vbs", "spct", "xml", "sh", "java", "json", "vbproj", "vdproj", "vcproj", "csproj", "xaml", "swift"],
        video: ["mp4", "mov", "ogg", "webm", "ts"],
        audio: ["flac", "mp3", "opus", "wav", "aac", "m4a"],
        markdown: ["md"],
    }
    for (let key in generalFormatDefinition) if (generalFormatDefinition[key].indexOf(value.substring(value.lastIndexOf(".") + 1)) !== -1) imgIcon = key;
    getImg(imgIcon, contentImg);
    let rightContainer = document.createElement("div");
    let previewExtension = []; // An array that will contain all the extensions that are previewable (I doubt this word exists tbh)
    for (let item in mediaContainer) previewExtension.push(...mediaContainer[item].extension); 
    if (previewExtension.indexOf(value.substring(value.lastIndexOf(".") + 1).toLowerCase()) !== -1) { // If the item is "previewable", add the preview button
        let preview = createRightButton("eye");
        preview.addEventListener("click", () => {
            moveDialog("previewDialog", preview, contentImg);
            previewHandler(value, imgIcon);
        })
        rightContainer.append(preview);
    }
    if (!searchAppend) { // Don't delete items from search
        let deleteBtn = createRightButton("delete");
        deleteBtn.addEventListener("click", () => {
            zip.remove(value);
            refreshEntry();
        });
        rightContainer.append(deleteBtn);
    }
    rightContainer.classList.add("rightFlex");
    let download = createRightButton("download"); // The button that'll permit to download the file/folder
    download.addEventListener("click", () => { 
        if (isFolder) { // If it's a folder, the user will be asked if they want to download it as a .zip file or if they want to extract it.
            moveDialog("downloadDialog", download, contentImg);
            addAnimation("downloadDialog", document.getElementById("downloadDialog").style.top === ""); // Show the prompt dialog
            arrayPrev = value; // Set the folder as the content to extract/download as zip
        } else {
            document.getElementById("fileSpinner").style.display = "block";
            zip.file(value).async("arraybuffer").then((buffer) => { // Get the file
                downloadItem(new Blob([buffer]), contentName); // And download it
                document.getElementById("fileSpinner").style.display = "none";
            })
        }
    })
    leftBtnName.append(contentImg, leftText);
    rightContainer.append(download);
    if (isFolder) { // Create a button to open the folder
        let folderScroll = createRightButton("folderopen");
        folderScroll.firstChild.classList.add("btnMargin");
        folderScroll.addEventListener("click", () => { // Read the new folder. 
            document.getElementById("fileSpinner").style.display = "block";
            // Delete folder-specific data that are no longer needed
            cleanItems();
            folderSuccessionLoaded.nextRef = [];
            folderSuccessionLoaded.nextStruct = [];
            document.querySelector("[data-fetch=next]").classList.add("disabled"); // The user has entered a new folder, so they can't go next
            containerId.innerHTML = "";
            folderSuccessionLoaded.structure++;
            folderSuccessionLoaded.ref = value;
            document.querySelector("[data-fetch=prev]").classList.remove("disabled"); // The user can still go backwards
            if (searchAppend) { // Close the search box
                document.getElementById("minimizeFetch").click();
                folderSuccessionLoaded.structure = value.split("/").length - 1; // Make the structure the same as the folder
            }
            document.getElementById("fileSpinner").style.display = "none";
            showItems(); // Recrate the file divs
        });
        rightContainer.append(folderScroll);
    }
    // And append everything
    btnContainer.append(leftBtnName, rightContainer);
    let containerOpt = [containerId, "container"];
    if (searchAppend) containerOpt = [document.getElementById("searchContent"), "search"];
    if (prepend) { containerOpt[0].prepend(btnContainer); folderSuccessionLoaded[containerOpt[1]].currentItems.unshift([value, isFolder]) } else { containerOpt[0].append(btnContainer); folderSuccessionLoaded[containerOpt[1]].currentItems.push([value, isFolder]) }
}
function createAlert(contentName, extraContent, alertId) { // Create a top notification
    if (localStorage.getItem("Unzipify-noAlert") !== null && localStorage.getItem("Unzipify-noAlert").indexOf(`-${alertId}`) !== -1) return; // If the user doesn't want to receive an alert, or they have asked to not show that type of alert, return.
    let alertContainer = document.createElement("div");
    alertContainer.classList.add("opacity", "alert");
    // Create the label that will contain the text
    let alertContent = document.createElement("l");
    alertContent.textContent = contentName;
    // Create the img icon for the alert
    let alertImg = document.createElement("img");
    alertImg.width = "28";
    alertImg.height = "28";
    alertImg.style.marginRight = "20px";
    getImg("alert", alertImg, getComputedStyle(document.body).getPropertyValue("--text"));
    // Create a label that, if clicked, this dialog won't be shown again
    let noShow = document.createElement("l");
    noShow.style.fontSize = "0.8rem";
    noShow.style.textDecoration = "underline";
    noShow.textContent = "Don't show again";
    noShow.style.marginLeft = "20px";
    noShow.style.cursor = "pointer";
    noShow.addEventListener("click", () => {
        if (localStorage.getItem("Unzipify-noAlert") === null) localStorage.setItem("Unzipify-noAlert", `-${alertId}`); else localStorage.setItem("Unzipify-noAlert", `${localStorage.getItem("Unzipify-noAlert")}-${alertId}`);
        removeItem();
    })
    alertContainer.append(alertImg, alertContent);
    if (extraContent !== undefined) alertContainer.append(extraContent);
    alertContainer.append(noShow);
    document.body.append(alertContainer);
    function removeItem() {
        setTimeout(() => { alertContainer.remove() }, 210); alertContainer.style.opacity = "0";
    }
    setTimeout(() => { alertContainer.style.opacity = "1"; setTimeout(() => { removeItem(); }, parseInt(document.getElementById("alertChange").value)) }, 15); // Set the timeout as the value that the user put in the settings
}
function downloadItem(blob, contentName) { // Just like the function name suggest, download an item from a blob
    let a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = contentName;
    a.textContent = "Force download";
    a.click();
    a.style.marginLeft = "20px";
    createAlert("Download started!", a, "startDownload");
}
function readyValue(val) { // The value to display on the file container. It's usually only the file/folder name, without the path.
    return val.replace(folderSuccessionLoaded.ref, "");
}
function getFileName(path) { // Get the file name
    path = deleteAccidentalSlash(path);
    return path.substring(path.lastIndexOf("/") + 1);
}
function createRightButton(icon, customColor, backgroundColor) { // Create a circular, action button at the right
    let container = document.createElement("div");
    container.classList.add("circle");
    if (backgroundColor !== undefined) container.style.backgroundColor = backgroundColor;
    let img = document.createElement("img");
    img.classList.add("buttonImg");
    getImg(icon, img, customColor);
    container.append(img);
    return container;
}
function removeAnimation(item) { // Make an element disappear with an animation
    if (typeof (item) === "string") item = document.getElementById(item);
    let addClass = item.classList.contains("revDisplayDialog") ? "revNoDisplayDialog" : "noDisplayDialog";
    item.classList.remove("displayDialog", "revDisplayDialog");
    setTimeout(() => {
        item.classList.add(addClass);
        setTimeout(() => { item.classList.remove(addClass); item.style.display = "none" }, 600);
    }, 15);
}
for (let item of document.querySelectorAll("[data-fetch]")) getImg(item.getAttribute("data-fetch"), item); // Fetch all the images from the DOM and add their icon as the source
document.getElementById("minimizeInner").addEventListener("click", () => { // Minimmize the preview dialog, deleting every preview that's going on
    document.getElementById("jsMediaContainer").innerHTML = "";
    removeAnimation(document.getElementById("previewDialog"));
})
let currentIteration = 0; // An integer that'll be an identifier for each user query. This is done to avoid excessive computing, see below for whhy
document.getElementById("searchItem").addEventListener("input", () => { // Every time the user writes something in the search textbox
    currentIteration++;  // Update the query identifier
    let tempIteration = currentIteration; 
    setTimeout(() => {
        if (tempIteration === currentIteration) { // If, after 150 seconds, the query is the same, compute the search. This is done to avoid lots of searches
            cleanItems(true); // Clean the temp items from the previous search
            document.getElementById("fileSpinner").style.display = "block"; // Display the loading animation
            let result = folderSuccessionLoaded.items.flat().filter(element => getFileName(element).toLowerCase().includes(document.getElementById("searchItem").value.toLowerCase())); // Filter the items to all the ones that contain the search query
            switch (document.getElementById("checkSelect").value) {
                case "b": // Only in the current folder and in the subfolders: filter the new result with only the items that start with the current directory
                    result = result.filter(element => element.toLowerCase().startsWith(folderSuccessionLoaded.ref.toLowerCase()));
                    break;
                case "c": // Only in the current folder: the item must have the same path as the current one
                    result = result.filter(element => deleteAccidentalSlash(element).substring(0, deleteAccidentalSlash(element).lastIndexOf("/")).toLowerCase() === deleteAccidentalSlash(folderSuccessionLoaded.ref).toLowerCase());
                    break;
            }
            document.getElementById("searchContent").innerHTML = ""; // Delete old search content
            document.getElementById("fileSpinner").style.display = "none";
            for (let i = 0; i < result.length; i++) if (i < 50) createBtn(readyValue(result[i]), result[i], totalFiles[result[i]].dir, false, true); else folderSuccessionLoaded["search"].nextLoadItems.push([result[i], totalFiles[result[i]].dir]); // For each result item, show them in the search file section. If there are more than 50, add them to the nextLoadItems so that there aren't that many items to load

        }
    }, 150)
});
let generalDialogShow = { // An action that contains all the items that trigger an input for a dialog, if the dialog sould be visible or not after the click, and the dialog ID where the change should happen
    contentClick: [document.getElementById("minimizeFetch"), document.getElementById("tempsearch"), document.getElementById("minimizeFolder"), document.querySelector("[data-action=folderDialog]"), document.querySelector("[data-fetch=folderzip]"), document.querySelector("[data-action=addfolder]"), document.querySelector("[data-action=folderzip]"), document.getElementById("folderCreate"), document.querySelector("[data-action=downloadDialog]"), document.getElementById("minimizeDownload"), document.querySelector("[data-action=download]"), document.querySelector("[data-action=extract]"), document.querySelector("[data-action=settings]"), document.getElementById("minimizeSettings")],
    show: [false, true, false, true, false, true, false, false, true, false, false, false, true, false],
    ref: [document.getElementById("searchContainer"), document.getElementById("searchContainer"), document.getElementById("folderDialog"), document.getElementById("folderDialog"), document.getElementById("newFolderExclusive"), document.getElementById("newFolderExclusive"), document.getElementById("folderDialog"), document.getElementById("folderDialog"), document.getElementById("downloadDialog"), document.getElementById("downloadDialog"), document.getElementById("downloadDialog"), document.getElementById("downloadDialog"), document.getElementById("settingsDialog"), document.getElementById("settingsDialog")]
};
for (let i = 0; i < generalDialogShow.contentClick.length; i++) {
    if (generalDialogShow.show[i]) { // If it should be shown
        generalDialogShow.contentClick[i].addEventListener("click", () => {
            generalDialogShow.ref[i].style.position = "absolute"; 
            if (generalDialogShow.ref[i].id !== "newFolderExclusive" || generalDialogShow.ref[i].id === "newFolderExclusive" && !generalDialogShow.show[i]) {
                generalDialogShow.ref[i].style.top = `${generalDialogShow.contentClick[i].getBoundingClientRect().bottom + 20}px`;
                generalDialogShow.ref[i].style.left = `${generalDialogShow.contentClick[i].getBoundingClientRect().left / 2}px`;
            }
            addAnimation(generalDialogShow.ref[i]); // Add the dialog animation
        })
    } else {
        generalDialogShow.contentClick[i].addEventListener("click", () => { removeAnimation(generalDialogShow.ref[i]) }) // Add the dialog removal animation
    }
}
document.querySelector("[data-action=addFile]").addEventListener("click", () => { // Add a new file to the ZIP file
    let input = document.createElement("input");
    input.type = "file";
    input.multiple = true;
    input.addEventListener("change", () => {
        uploadFile(input.files);
    });
    input.click();
})
function downloadZipItem(zipContent) { // Download the selected zip file to, well, a zip file
    zipContent.generateAsync({ type: "blob", compression: "DEFLATE" })
        .then((content) => {
            // Append in case it doesn't download!
            downloadItem(content, "zip.zip");
            document.getElementById("fileSpinner").style.display = "none";

        });
}
document.querySelector("[data-action=download]").addEventListener("click", () => { // Download the content as a zip file
    document.getElementById("fileSpinner").style.display = "block";
    if (arrayPrev === "") { // The zip file must be downloaded entirely, so there's no need to create a new one
        downloadZipItem(zip);
    } else { // Only some parts of the zip file must be downloaded, so a new zip file will be crated and their items will be added.
        let newZip = new JSZip();
        let items = fetchArrayPrev(); // Get all the items that are in the same directory
        let i = 0;
        function loopAdvance() { // Continue with the loop. Do this so that the website knows where all the items are added.
            i++;
            if (i < items.length) singleLoop(); else downloadZipItem(newZip);
        }
        function singleLoop() { 
            if (items[i].replace(arrayPrev, "") !== "" && !items[i].endsWith("/")) {
                zip.file(items[i]).async("arraybuffer").then((result) => { // Get the file from the original zip
                    newZip.file(items[i].replace(arrayPrev, ""), new Blob([result]), { createFolders: true }); // And add it to the new one
                    loopAdvance(); // Continue with the loop
                })
            } else if (items[i].endsWith("/")) { // The item to add is a folder, so a new one will be crated in the zip.
                newZip.folder(items[i].substring(0, items[i].lastIndexOf("/")).replace(arrayPrev, ""));
                loopAdvance();
            }
        };
        singleLoop();
    }
});
function uploadFile(fileArray, isFolder) {
    // Make this without for loop so that a item at a time is loaded (multiple items gave some problems during testing)
    let i = 0;
    document.getElementById("fileSpinner").style.display = "block";
    function readItem() { // Read the selected items
        let read = new FileReader();
        read.onload = () => {
            zip.file(`${folderSuccessionLoaded.ref}${isFolder ? fileArray[i].webkitRelativePath : fileArray[i].name}`, new Blob([read.result]), { createFolders: true }); // Crate a file by getting the name of the file. If the user has chosen a folder, use the relative path nae,
            i++;
            if (i < fileArray.length) readItem(); else { document.getElementById("fileSpinner").style.display = "none"; refreshEntry(); createAlert("Added file into the ZIP!", undefined, "zipAdd"); } // If there's something else to add, do it; otherwise refresh the current ZIP file
        }
        read.onerror = (error) => { // In case there's an error, continue with the next file
            console.warn(error);
            createAlert(`${read.error} [${fileArray[i].name}]`, undefined, "saveFileError");
            i++;
            if (i < fileArray.length) readItem(); else { document.getElementById("fileSpinner").style.display = "none"; refreshEntry(); createAlert("Added file into the ZIP!", undefined, "zipAdd"); }

        }
        read.readAsArrayBuffer(fileArray[i]);
    }
    readItem();
}
function refreshEntry() { // Reload the zip file container div with the new items
    if (folderSuccessionLoaded.isNew) totalFiles = zip.files;
    cleanItems(); folderSuccessionLoaded.items = []; document.getElementById("fileContainer").innerHTML = ""; improvedReader();
}
document.querySelector("[data-action=folderzip]").addEventListener("click", () => { // The user wants to choose a folder to zip
    let input = document.createElement("input");
    input.type = "file";
    for (let item of ["webkitdirectory", "multiple"]) input.setAttribute(item, ""); // Add these attributes so that most browser will permit to choose a directory
    input.addEventListener("change", () => {
        document.getElementById("fileSpinner").style.display = "block";
        uploadFile(input.files, true); // Upload the files
        document.getElementById("fileSpinner").style.display = "none";
    });
    input.click();
});
document.getElementById("folderCreate").addEventListener("click", () => { // Create a new folder in the zip file
    document.getElementById("fileSpinner").style.display = "block";
    zip.folder(`${folderSuccessionLoaded.ref}${document.getElementById("folderName").value}`);
    refreshEntry(); // Update the zip file div with the new folder
    document.getElementById("fileSpinner").style.display = "none";
});
let arrayPrev = ""; // A value that will indicate the start path of each content to download (especially when exporting folders)
function fetchArrayPrev() { // Get the elements that are in the sampe path of arrayPrev
    let zipContent = Object.keys(zip.files);
    return zipContent.filter(element => element.toLowerCase().startsWith(arrayPrev.toLowerCase()));
}
document.querySelector("[data-action=extract]").addEventListener("click", async () => { // Extract the selected zip contents to the user's device
    if (document.querySelector("[data-action=extract]").classList.contains("disabled")) return; // If the browser doesn't support the API yet, return
    document.getElementById("fileSpinner").style.display = "block";
    let zipContent = fetchArrayPrev(); // Get only the files to export
    let userDir = await window.showDirectoryPicker(); // Ask the user where they want to save the zip file
    for (let item of zipContent) { 
        let finalDir = userDir;
        let oldItem = item;
        item = item.replace(arrayPrev, "");
        if (item.split("/").length > 1) { // Get each subdirectory, so that the folder structure can be preserved
            let split = item.split("/");
            for (let i = 0; i < split.length - 1; i++) {
                finalDir = await finalDir.getDirectoryHandle(split[i], { create: true }); // Ask the browser to have access to the subdirectory
            }
        }
        if (!item.endsWith("/") && item !== "") { // Now that the item isn't a nested folder with a file and, if it has a name, continue
            let fileHandle = await finalDir.getFileHandle(item.substring(item.lastIndexOf("/") + 1), { create: true }); // Ask the browser to write a file
            let writable = await fileHandle.createWritable(); // Ask the browser to write to the file
            let fetchZip = await zip.file(oldItem).async("arraybuffer"); // Get the current file
            await writable.write(fetchZip); // Write the ArrayBuffer to the file
            await writable.close(); // Clsoe writing
        }
    }
    document.getElementById("fileSpinner").style.display = "none";
    createAlert("Finished extracting zip file!", undefined, "zipExtractFinish");
});
document.querySelector("[data-action=next]").addEventListener("click", () => { // Go to the next page
    if (document.querySelector("[data-fetch=next]").classList.contains("disabled")) return; // If there's nothing next, don't show anything
    document.getElementById("fileSpinner").style.display = "block";
    containerId.innerHTML = "";
    // See the [data-action=prev]
    folderSuccessionLoaded.structure = folderSuccessionLoaded.nextStruct[0];
    folderSuccessionLoaded.ref = folderSuccessionLoaded.nextRef[0];
    folderSuccessionLoaded.nextRef.shift();
    folderSuccessionLoaded.nextStruct.shift();
    if (folderSuccessionLoaded.nextRef.length === 0) document.querySelector("[data-fetch=next]").classList.add("disabled");
    document.querySelector("[data-fetch=prev]").classList.remove("disabled");
    cleanItems();
    document.getElementById("fileSpinner").style.display = "none";
    showItems();
});
document.querySelector("[data-action=downloadDialog]").addEventListener("click", () => { // If the user clicks the download dialog, they want to download the entire ZIP file.
    arrayPrev = "";
})
function addHoverEvents(item) { // Add brightness animation when hovering an item
    item.addEventListener("mouseover", () => {
        if (item.classList.contains("disabled")) return;
        item.classList.remove("byehover");
        item.classList.add("hover");
    });
    item.addEventListener("mouseleave", () => {
        if (item.classList.contains("disabled")) return;
        item.classList.remove("hover");
        item.classList.add("byehover");
    });
}
for (let item of [...document.querySelectorAll("[data-change]"), ...document.getElementsByClassName("button"), ...document.querySelectorAll("input")]) addHoverEvents(item); // Add the animation to some elements from the DOM
if (navigator.userAgent.toLowerCase().indexOf("safari") !== -1 && navigator.userAgent.toLowerCase().indexOf("chrome") === -1) document.querySelector("[data-action=extract]").classList.add("disabled"); // Currently, Safari doesn't support the extraction of a zip file directly, soo it'll be disabled
let customOptions = { // An array that will just contain the default themes
    defaultThemes: [{
        name: "Dracula Dark",
        color: {
            text: "#fcf7f2",
            background: "#282a36",
            card: "#44475A",
            row: "#787b90",
            accent: "#34d4b2"
        },
        themeIdentifier: "a"
    },
    {
        name: "Simple Dark",
        color: {
            text: "#fcf7f2",
            background: "#191919",
            card: "#393939",
            row: "#6b6b6b",
            accent: "#81C784"
        },
        themeIdentifier: "b"
    },
    {
        name: "Simple Light",
        color: {
            text: "#171717",
            background: "#f5f5f5",
            card: "#d3d3d3",
            row: "#b9b9b9",
            accent: "#5D4037"
        },
        themeIdentifier: "c"
    }
    ],
}
let customThemes = []; // Custom themes
if (localStorage.getItem("Unzipify-customThemes") !== null) {
    try {
        customThemes = JSON.parse(localStorage.getItem("Unzipify-customThemes")) // Get the custom themes the user has created
    } catch (ex) {
        console.warn(ex);
    }
}
function createThemeOptions(theme, custom) { // Create a container in the settings that'll show each theme
    let themeContainer = document.createElement("div");
    themeContainer.classList.add("btnContainer", "heightAnimation");
    themeContainer.style = "width: 100%; background-color: var(--background); max-height: 45px";
    // Div where the theme name will be added
    let leftDiv = document.createElement("div");
    leftDiv.classList.add("leftContent", "fillHeight");
    let leftText = document.createElement("l");
    leftText.textContent = theme.name;
    leftText.classList.add("heightAnimation");
    leftText.style = "max-height: 30px; overflow: scroll;";
    leftDiv.append(leftText);
    // Div where the action buttons will be added
    let rightContainer = document.createElement("div");
    if (custom) { // If the theme is custom, permit to delete it.
        let deleteBtn = createRightButton("delete", theme.color.accent, theme.color.row);
        deleteBtn.addEventListener("click", () => { 
            customThemes.splice(customThemes.findIndex(theme => theme.themeIdentifier === theme.themeIdentifier), 1); // Find the index of the custom theme that'll be deleted, and delete it
            localStorage.setItem("Unzipify-customThemes", JSON.stringify(customThemes)); // Save the new custom theme selection
            themeContainer.style.maxHeight = "0px";
            document.getElementById("themeContainer").style.maxHeight = `${parseInt(document.getElementById("themeContainer").style.maxHeight.replace("px", "")) - 60}px`; // Add a height animation to the theme container div
            setTimeout(() => { themeContainer.remove() }, 210); // And finally remove it from the DOM
        });
        rightContainer.append(deleteBtn);
    }
    let applyBtn = createRightButton("color", theme.color.accent, theme.color.row); // Button that applies the current theme
    applyBtn.addEventListener("click", () => { checkAndApply(theme) });
    let downloadBtn = createRightButton("download", theme.color.accent, theme.color.row); // Button that'll download the theme as a JSON file
    downloadBtn.addEventListener("click", () => {
        downloadItem(new Blob([JSON.stringify(theme)], { type: "application/json" }), `${theme.name}-exported.json`);
    })
    rightContainer.classList.add("rightFlex");
    rightContainer.append(downloadBtn, applyBtn);
    themeContainer.append(leftDiv, rightContainer);
    document.getElementById("themeContainer").append(themeContainer);
    document.getElementById("themeContainer").style.maxHeight = `${parseInt(document.getElementById("themeContainer").style.maxHeight.replace("px", "")) + 60}px`;
}
for (let items of customOptions.defaultThemes) createThemeOptions(items); // Add themes to their dedicated section in the settings dialog
for (let items of customThemes) createThemeOptions(items, true); // Add themes to their dedicated section in the settings dialog
for (let items of document.querySelectorAll("[data-change]")) items.addEventListener("input", () => { // Change the color for each color input in the Custom theme tab
    document.documentElement.style.setProperty(`--${items.getAttribute("data-change")}`, items.value);
})
document.getElementById("saveTheme").addEventListener("click", () => { // The button that saves the theme the user has created
    let name = prompt("Choose a name for this new theme:"); // Ask the user for a name
    if (name === undefined) return;
    let newItem = { // And create the object that'll contain it
        name: name,
        color: {},
        themeIdentifier: new Date().toISOString()
    }
    for (let item of document.querySelectorAll("[data-change]")) newItem.color[item.getAttribute("data-change")] = item.value; // Add to the object each color type
    customThemes.push(newItem); // Add it to the custom themes
    localStorage.setItem("Unzipify-customThemes", JSON.stringify(customThemes)); // And save all the new themes in the LocalStorage
    createThemeOptions(newItem, true); // Add it to its dedicated section in the settings dialog 
    checkAndApply(newItem); // And, if everything is okay, apply it
});
function checkAndApply(theme, noApply) { // This function looks if the value is an hex color and, if yes, it'll be applied as the color in the CSS
    if (theme.color === undefined) return;
    for (let colorId in theme.color) if (/^#[0-9A-F]{6}$/i.test(theme.color[colorId])) { // If it's a hex color, paply it
        document.documentElement.style.setProperty(`--${colorId}`, theme.color[colorId]);
        if (document.querySelector(`[data-change=${colorId}]`) !== null) document.querySelector(`[data-change=${colorId}]`).value = theme.color[colorId];
    }
    if (!noApply) localStorage.setItem("Unzipify-currentTheme", JSON.stringify(theme)); // If the user wants to apply the new theme, their choice will be saved in the LocalStorage, so that it'll be restored even after the user refreshes the tab
    for (let item of document.querySelectorAll("[data-fetch]")) getImg(item.getAttribute("data-fetch"), item); // Regenerate the color of the icons that use the accent color
}
if (localStorage.getItem("Unzipify-currentTheme") !== null) checkAndApply(JSON.parse(localStorage.getItem("Unzipify-currentTheme"))); else checkAndApply(customOptions.defaultThemes[1]) // If the user has chosen an item, apply it. Otherwise, apply the default dark theme
document.getElementById("importTheme").addEventListener("click", () => { // The button that'll permit the user to import a theme from a JSON file
    let input = document.createElement("input");
    input.type = "file";
    input.onchange = (() => {
        let read = new FileReader();
        read.onload = (() => {
            checkAndApply(JSON.parse(read.result), true); // Look if the values are hex colors and, if true, put them in the input checkboxes. However, don't save the theme yet.
            createAlert("Theme imported! Make sure to save it so that you won't need to import it again", undefined, "importedTheme");
        });
        read.readAsText(input.files[0]);
    });
    input.click();
})
document.querySelector("[data-change=accent]").addEventListener("change", () => { // Regenerate the icons that use the accent color
    for (let item of document.querySelectorAll("[data-fetch]")) getImg(item.getAttribute("data-fetch"), item);
})
document.getElementById("alertChange").addEventListener("input", () => { // Save the alert duration change in the LocalStorage
    localStorage.setItem("Unzipify-alertDuration", document.getElementById("alertChange").value);
});
let valueCheck = { // A simple object that'll look if a property is in the LocalStorage, and, if true, it'll edit the value of a HTML object
    localItem: ["Unzipify-alertDuration"],
    ref: [document.getElementById("alertChange")],
    changeType: ["value"]
};
for (let i = 0; i < valueCheck.localItem.length; i++) if (localStorage.getItem(valueCheck.localItem[i]) !== null) valueCheck.ref[i][valueCheck.changeType[i]] = localStorage.getItem(valueCheck.localItem[i]);
document.getElementById("openSource").addEventListener("click", () => { // Load the open-source markdown file
    fetch("./OpenSource.md").then((res) => { // Fetch the Open Source markdown file
        res.text().then((text) => {
            getOptionalLibraries("https://cdn.jsdelivr.net/npm/markdown-it@13.0.1/dist/markdown-it.min.js").then(() => {
                let md = window.markdownit();
                document.getElementById("openSourceDiv").innerHTML = md.render(text);
            })
        })
    })
})
if (navigator.userAgent.toLowerCase().indexOf("safari") !== -1 && navigator.userAgent.toLowerCase().indexOf("chrome") === -1) {
    document.getElementById("safariStyle").innerHTML = `select {-webkit-appearance: none; background-image: url("data:image/svg+xml;utf8,<svg version='1.1' xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink' width='24' height='24' viewBox='0 0 24 24'><path fill='${getComputedStyle(document.body).getPropertyValue("--text").replace("#", "%23")}' d='M7.406 7.828l4.594 4.594 4.594-4.594 1.406 1.406-6 6-6-6z'></path></svg>"); background-position: 100% 50%; background-repeat: no-repeat; font-size: 10pt}`;
} // Add a quick fix to Safari's strange select appearance
// Install the website as a Progressive Web App
let installationPrompt;
window.addEventListener('beforeinstallprompt', (event) => { // Capture the install prompt
    event.preventDefault();
    installationPrompt = event;
});
document.getElementById("pwaBtn").addEventListener("click", () => { // And then use it when the user wants to install the PWA
    installationPrompt.prompt();
    installationPrompt.userChoice.then(choice => {
        if (choice.outcome === "accepted") document.getElementById("pwaTab").style.display = "none";
    });
});
if (window.matchMedia('(display-mode: standalone)').matches) document.getElementById("pwaTab").style.display = "none"; // The user is already running a PWA, so the PWA display can be hidden.
function generateHover() { // Add a description of every hovered action.
    document.getElementById("hoverContainer").innerHTML = "";
    for (let item of document.querySelectorAll("[data-hover]")) {
        let hoverContainer = document.createElement("div");
        hoverContainer.classList.add("hoverDialog");
        hoverContainer.style.top = `${item.getBoundingClientRect().bottom + 15}px`;
        hoverContainer.style.left = `${item.getBoundingClientRect().left + 15}px`;
        let hoverTextContainer = document.createElement("div");
        hoverTextContainer.classList.add("hoverContainer");
        let hoverText = document.createElement("l");
        hoverText.textContent = item.getAttribute("data-hover");
        item.addEventListener("mouseenter", () => {
            hoverContainer.style.display = "block";
            setTimeout(() => { hoverContainer.style.opacity = "1" }, 15);
        });
        item.addEventListener("mouseleave", () => {
            setTimeout(() => { hoverContainer.style.display = "none" }, 210);
            hoverContainer.style.opacity = "0";
        });
        hoverTextContainer.append(hoverText);
        hoverContainer.append(hoverTextContainer);
        document.getElementById("hoverContainer").append(hoverContainer);
    }
}
