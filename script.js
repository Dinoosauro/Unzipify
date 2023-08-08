if ('serviceWorker' in navigator) {
    let registration;
    const registerServiceWorker = async () => {
        registration = await navigator.serviceWorker.register('./service-worker.js',);
    };
    registerServiceWorker();
}
let appVersion = "1.0.0";
fetch("https://dinoosauro.github.io/UpdateVersion/unzipify-updatecode", { cache: "no-store" }).then((res) => res.text().then((text) => { if (text.replace("\n", "") !== appVersion) if (confirm(`There's a new version of Unzipify. Do you want to update? [${appVersion} --> ${text.replace("\n", "")}]`)) { caches.delete("unzipify-cache"); location.reload(true); } }).catch((e) => { console.error(e) })).catch((e) => console.error(e));
document.getElementById("versionId").textContent = appVersion;
let zip = new JSZip();
let totalFiles = [];
let folderSuccessionLoaded = {
    items: [],
    ref: "",
    nextRef: [],
    nextStruct: [],
    structure: 0,
    container: {
        nextLoadItems: [],
        prevLoadItems: [],
        currentItems: [],
    },
    search: {
        nextLoadItems: [],
        prevLoadItems: [],
        currentItems: [],
    },
    position: "left",
    isNew: false
};
document.getElementById("startNew").addEventListener("click", () => {
    folderSuccessionLoaded.isNew = true;
    document.getElementById("introduction").style.opacity = 0;
    setTimeout(() => {
        document.getElementById("introduction").style.display = "none";
        document.getElementById("toolbar").style.display = "flex";
        setTimeout(() => { generateHover() }, 150);
        setTimeout(() => { document.getElementById("toolbar").style.opacity = "1" }, 15);
    }, 250);
})
document.getElementById("fileBtn").addEventListener("click", () => {
    let input = document.createElement("input");
    input.type = "file";
    input.addEventListener("change", () => {
        document.getElementById("fileSpinner").style.display = "block";
        let file = new FileReader();
        file.addEventListener("load", () => {
            zip.loadAsync(file.result).then((fileArray) => {
                document.getElementById("introduction").style.opacity = 0;
                totalFiles = fileArray.files;
                setTimeout(() => {
                    document.getElementById("introduction").style.display = "none";
                    document.getElementById("toolbar").style.display = "flex";
                    setTimeout(() => { generateHover() }, 150);
                    setTimeout(() => { document.getElementById("toolbar").style.opacity = "1" }, 15);
                    improvedReader();
                }, 250);
            });
        });
        file.readAsArrayBuffer(input.files[0]);
    })
    input.click();
});
function improvedReader() {
    let fetchKeys = Object.keys(totalFiles);
    for (let i = 0; i < fetchKeys.length; i++) {
        if (typeof (folderSuccessionLoaded.items[fetchKeys[i].split("/").length - 1]) === "undefined") folderSuccessionLoaded.items[fetchKeys[i].split("/").length - 1] = [];
        folderSuccessionLoaded.items[fetchKeys[i].split("/").length - 1].push(fetchKeys[i]);
    }
    document.getElementById("fileSpinner").style.display = "none";
    showItems();
}
function getIfSameFolder(path, isFolder) {
    if (isFolder) path = path.substring(0, path.lastIndexOf("/"));
    path = path.substring(0, path.lastIndexOf("/"));
    return path;
}
function deleteAccidentalSlash(item) {
    if (item.endsWith("/")) return item.substring(0, item.lastIndexOf("/"));
    return item;
}
function showItems() {
    let itemCount = 0;
    if (folderSuccessionLoaded.items[folderSuccessionLoaded.structure + 1] !== undefined) for (let lookFolder of folderSuccessionLoaded.items[folderSuccessionLoaded.structure + 1]) if (lookFolder.endsWith("/") && getIfSameFolder(lookFolder, true) === deleteAccidentalSlash(folderSuccessionLoaded.ref)) { if (itemCount < 50) createBtn(readyValue(lookFolder), lookFolder, true); else folderSuccessionLoaded["container"].nextLoadItems.push([lookFolder, true]); itemCount++ }
    if (folderSuccessionLoaded.items[folderSuccessionLoaded.structure] !== undefined) for (let lookFile of folderSuccessionLoaded.items[folderSuccessionLoaded.structure]) if (getIfSameFolder(lookFile, false) === deleteAccidentalSlash(folderSuccessionLoaded.ref) && deleteAccidentalSlash(lookFile) !== deleteAccidentalSlash(folderSuccessionLoaded.ref)) { if (itemCount < 50) createBtn(readyValue(lookFile), lookFile, false); else folderSuccessionLoaded["container"].nextLoadItems.push([lookFile, false]) };
}
let containerId = document.getElementById("fileContainer");
function scrollLogic(container, connection, search) {
    let percentage = Math.round((container.scrollTop / (container.scrollHeight - container.offsetHeight)) * 100);
    if (percentage > 90) {
        let getMaxScroll = 25;
        if (getMaxScroll > folderSuccessionLoaded[connection].nextLoadItems.length) getMaxScroll = folderSuccessionLoaded[connection].nextLoadItems.length;
        for (let i = 0; i < getMaxScroll; i++) {
            if (folderSuccessionLoaded[connection].currentItems[i] !== undefined) {
                container.firstChild.remove();
                folderSuccessionLoaded[connection].prevLoadItems.push(folderSuccessionLoaded[connection].currentItems[0]);
                folderSuccessionLoaded[connection].currentItems.splice(0, 1);
            }
            createBtn(readyValue(folderSuccessionLoaded[connection].nextLoadItems[i][0]), folderSuccessionLoaded[connection].nextLoadItems[i][0], folderSuccessionLoaded[connection].nextLoadItems[i][1], undefined, search);
        }
        folderSuccessionLoaded[connection].nextLoadItems.splice(0, getMaxScroll);
        // TODO: delete before the first 25 items above, and add them to prevLoadItems. Then, if scroll percentage is below 10%, do the inverted thing.
    } else if (percentage < 10) {
        let getMinScroll = 25;
        if (getMinScroll > folderSuccessionLoaded[connection].prevLoadItems.length) getMinScroll = folderSuccessionLoaded[connection].prevLoadItems.length;
        for (let i = 0; i < getMinScroll; i++) {
            let containers = container.childNodes;
            if (containers.length !== 0) {
                containers[containers.length - 1].remove();
                folderSuccessionLoaded[connection].nextLoadItems.unshift(folderSuccessionLoaded[connection].currentItems[containers.length - 1]);
                folderSuccessionLoaded[connection].currentItems.splice(containers.length - 1, 1);
            }
            createBtn(readyValue(folderSuccessionLoaded[connection].prevLoadItems[folderSuccessionLoaded[connection].prevLoadItems.length - i - 1][0]), folderSuccessionLoaded[connection].prevLoadItems[folderSuccessionLoaded[connection].prevLoadItems.length - i - 1][0], folderSuccessionLoaded[connection].prevLoadItems[folderSuccessionLoaded[connection].prevLoadItems.length - i - 1][1], true, search);
        }
        folderSuccessionLoaded[connection].prevLoadItems.splice(folderSuccessionLoaded[connection].prevLoadItems.length - getMinScroll, getMinScroll);
    }
}
containerId.addEventListener("scroll", () => {
    scrollLogic(containerId, "container")
});
document.getElementById("searchContent").addEventListener("scroll", () => {
    scrollLogic(document.getElementById("searchContent"), "search", true);
});
let mediaContainer = {
    video: {
        extension: ["mp4", "mov", "ogg", "webm", "ts"],
        containerFormat: document.createElement("video"),
        indexType: "src"
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
document.querySelector("[data-action=back]").addEventListener("click", () => {
    if (document.querySelector("[data-fetch=prev]").classList.contains("disabled")) return;
    folderSuccessionLoaded["container"].nextLoadItems = [];
    folderSuccessionLoaded.nextRef.unshift(folderSuccessionLoaded.ref);
    folderSuccessionLoaded.nextStruct.unshift(folderSuccessionLoaded.structure);
    document.querySelector("[data-fetch=next]").classList.remove("disabled");
    if (folderSuccessionLoaded.ref.split("/").length <= 2) {
        folderSuccessionLoaded.ref = "";
        folderSuccessionLoaded.structure = 0;
        document.querySelector("[data-fetch=prev]").classList.add("disabled");
        containerId.innerHTML = "";
    } else {
        folderSuccessionLoaded.ref = folderSuccessionLoaded.ref.substring(0, folderSuccessionLoaded.ref.length - 1);
        folderSuccessionLoaded.ref = folderSuccessionLoaded.ref.substring(0, folderSuccessionLoaded.ref.lastIndexOf("/"));
        folderSuccessionLoaded.structure--;
        containerId.innerHTML = "";
    }
    cleanItems();
    showItems();
})
function cleanItems(search) {
    folderSuccessionLoaded.position = "left";
    let containerType = "container";
    if (search) containerType = "search"
    folderSuccessionLoaded[containerType].currentItems = [];
    folderSuccessionLoaded[containerType].nextLoadItems = [];
    folderSuccessionLoaded[containerType].prevLoadItems = [];
}
let fetchAssets;
fetch("./assets/mergedAssets.json").then((res) => { res.json().then((json) => { fetchAssets = json }).catch((ex) => { console.error(ex) }) }).catch((ex) => { console.error(ex) });
function getImg(icon, item, customColor) {
    if (fetchAssets === undefined) {
        setTimeout(() => getImg(icon, item, customColor), 150);
        return;
    }
    if (fetchAssets[icon] === undefined) {
        console.warn(`Icon not found: ${icon}`);
        icon = "document";
    }
    let itemColor = getComputedStyle(document.body).getPropertyValue("--accent");
    if (customColor !== undefined) itemColor = customColor; else item.setAttribute("data-fetch", icon);
    item.src = URL.createObjectURL(new Blob([fetchAssets[icon].replaceAll("#212121", itemColor)], { type: "image/svg+xml" }));
    addHoverEvents(item);
}
let PDFUtil = [null, 1, document.createElement("canvas"), 1];
let urlAdd = [];
function getOptionalLibraries(url) {
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
function addAnimation(item, reverse) {
    if (typeof (item) === "string") item = document.getElementById(item);
    item.style.opacity = "1";
    item.style.display = "block";
    if (!reverse) item.classList.add("displayDialog"); else item.classList.add("revDisplayDialog");
}
function previewHandler(value, imgIcon) {
    if (value.endsWith("pdf")) document.getElementById("pdfControlContainer").style.display = "flex"; else document.getElementById("pdfControlContainer").style.display = "none";
    document.getElementById("fileSpinner").style.display = "block";
    if (document.getElementById("jsMediaContainer").firstChild !== null) URL.revokeObjectURL(document.getElementById("jsMediaContainer").firstChild.src);
    document.getElementById("jsMediaContainer").innerHTML = "";
    addAnimation("previewDialog", document.getElementById("previewDialog").style.top === "");
    let fetchElement = mediaContainer[imgIcon].containerFormat;
    document.getElementById("fileName").textContent = value;
    zip.file(value).async("arraybuffer").then(async (buffer) => {
        switch (mediaContainer[imgIcon].indexType) {
            case "src":
                fetchElement.setAttribute("controls", "");
                fetchElement.classList.add("contentRespect");
                document.getElementById("fileSpinner").style.display = "none";
                if (mediaContainer[imgIcon].askType !== undefined) {
                    switch (mediaContainer[imgIcon].askType) {
                        case "audio/*":
                            fetchElement.src = URL.createObjectURL(new Blob([buffer], { type: mediaContainer.audio.mimeRefer[mediaContainer.audio.extension.indexOf(value.substring(value.lastIndexOf(".") + 1))] }));
                            break;
                    }
                    document.getElementById("fileSpinner").style.display = "none";
                } else {
                    switch (value.substring(value.lastIndexOf(".") + 1)) {
                        case "svg":
                            fetchElement.src = URL.createObjectURL(new Blob([buffer], { type: "image/svg+xml" }));
                            document.getElementById("fileSpinner").style.display = "none";
                            break;
                        case "heif": case "heic":
                            await getOptionalLibraries("./heic2any.js");
                            let blob = new Blob([buffer]);
                            heic2any({ blob }).then((blobResult) => { fetchElement.src = URL.createObjectURL(blobResult); document.getElementById("fileSpinner").style.display = "none"; });
                            break;
                        default:
                            fetchElement.src = URL.createObjectURL(new Blob([buffer]));
                            document.getElementById("fileSpinner").style.display = "none";
                            break;
                    }
                }
                break;
            case "innerHTML":
                fetchElement.classList.add("textPreview");
                if (value.substring(value.lastIndexOf(".") + 1) === "md") {
                    await getOptionalLibraries("https://cdn.jsdelivr.net/npm/markdown-it@13.0.1/dist/markdown-it.min.js");
                    let md = window.markdownit();
                    fetchElement.innerHTML = md.render(new TextDecoder().decode(new Uint8Array(buffer)));
                } else {
                    fetchElement.style = "white-space: pre";
                    fetchElement.textContent = (new TextDecoder().decode(new Uint8Array(buffer)));
                }
                document.getElementById("fileSpinner").style.display = "none";
                break;
            case "pdf":
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
document.querySelector("[data-action=prevPage]").addEventListener("click", () => {
    if (PDFUtil[1] === 1) return;
    PDFUtil[1]--;
    PDFExtract();
});
document.querySelector("[data-action=nextPage]").addEventListener("click", () => {
    PDFUtil[1]++;
    PDFExtract();
});
function PDFExtract() {
    let canvas = document.getElementById("pdfCanvas");
    PDFUtil[0].getPage(PDFUtil[1]).then((page) => {
        let viewport = page.getViewport({ scale: PDFUtil[3], });
        let outputScale = window.devicePixelRatio || 1;
        if (PDFUtil[3] !== 1) canvas.style = `width: ${viewport.width}px; height: ${viewport.height}px; overflow: scroll; border-radius: 8px;`; else "width: 100%; height: auto; border-radius: 8px;";
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
    }).catch((ex) => {
        console.warn(ex);
        document.querySelector("[data-action=prevPage]").click();
    })
}
function moveDialog(dialogName, preview, contentImg) {
    document.getElementById(dialogName).style.marginLeft = "20vw";
    document.getElementById(dialogName).style.position = "absolute";
    for (let item of ["top", "left", "right", "bottom"]) document.getElementById(dialogName).style[item] = "";
    if (preview.getBoundingClientRect().y < document.body.offsetHeight * 60 / 100) document.getElementById(dialogName).style.top = `${preview.getBoundingClientRect().top + 15}px`; else document.getElementById(dialogName).style.bottom = `${preview.getBoundingClientRect().bottom + 15}px`;
    if (contentImg.getBoundingClientRect().left < document.body.offsetWidth * 40 / 100) document.getElementById(dialogName).style.left = `${contentImg.getBoundingClientRect().left + 15}px`; else document.getElementById(dialogName).style.right = `${contentImg.getBoundingClientRect().right - contentImg.getBoundingClientRect().left + 15}px`;

}
function createBtn(contentName, value, isFolder, prepend, searchAppend) {
    let btnContainer = document.createElement("div");
    btnContainer.classList.add("btnContainer");
    if (!searchAppend) {
        if (folderSuccessionLoaded.position === "left") { btnContainer.classList.add("rightMargin"); folderSuccessionLoaded.position = "right"; } else { btnContainer.classList.add("leftMargin"); folderSuccessionLoaded.position = "left"; }
    } else btnContainer.style = "width: 100%";
    let leftBtnName = document.createElement("div");
    leftBtnName.classList.add("leftContent");
    let leftText = document.createElement("l");
    leftText.style = "max-height: 30px; overflow: scroll;";
    leftText.textContent = contentName;
    let contentImg = document.createElement("img");
    contentImg.style = "width: 28px; height: 28px; margin-right: 10px; cursor: auto";
    let imgIcon = "document";
    // Sources: https://emulation.fandom.com/wiki/List_of_filetypes | https://en.wikipedia.org/wiki/List_of_file_formats | My knowledge
    let generalFormatDefinition = {
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
    if (isFolder) imgIcon = "folder";
    getImg(imgIcon, contentImg);

    let rightContainer = document.createElement("div");
    let previewExtension = [];
    for (let item in mediaContainer) previewExtension.push(...mediaContainer[item].extension);
    if (previewExtension.indexOf(value.substring(value.lastIndexOf(".") + 1).toLowerCase()) !== -1) {
        let preview = createRightButton("eye");
        preview.addEventListener("click", () => {
            moveDialog("previewDialog", preview, contentImg);
            previewHandler(value, imgIcon);
        })
        rightContainer.append(preview);
    }
    if (!searchAppend) {
        let deleteBtn = createRightButton("delete");
        deleteBtn.addEventListener("click", () => {
            zip.remove(value);
            refreshEntry();
        });
        rightContainer.append(deleteBtn);
    }
    rightContainer.classList.add("rightFlex");
    let download = createRightButton("download");
    download.addEventListener("click", () => {
        if (isFolder) {
            moveDialog("downloadDialog", download, contentImg);
            addAnimation("downloadDialog", document.getElementById("downloadDialog").style.top === "");
            arrayPrev = value;
        } else {
            document.getElementById("fileSpinner").style.display = "block";
            zip.file(value).async("arraybuffer").then((buffer) => {
                downloadItem(new Blob([buffer]), contentName);
                document.getElementById("fileSpinner").style.display = "none";
            })
        }
    })
    leftBtnName.append(contentImg, leftText);
    rightContainer.append(download);
    if (isFolder) {
        let folderScroll = createRightButton("folderopen");
        folderScroll.firstChild.classList.add("btnMargin");
        folderScroll.addEventListener("click", () => {
            document.getElementById("fileSpinner").style.display = "block";
            cleanItems();
            folderSuccessionLoaded.nextRef = [];
            folderSuccessionLoaded.nextStruct = [];
            document.querySelector("[data-fetch=next]").classList.add("disabled");
            containerId.innerHTML = "";
            folderSuccessionLoaded.structure++;
            folderSuccessionLoaded.ref = value;
            document.querySelector("[data-fetch=prev]").classList.remove("disabled");
            if (searchAppend) {
                document.getElementById("minimizeFetch").click();
                folderSuccessionLoaded.structure = value.split("/").length - 1;
            }
            document.getElementById("fileSpinner").style.display = "none";
            showItems();
        });
        rightContainer.append(folderScroll);
    }
    btnContainer.append(leftBtnName, rightContainer);
    let containerOpt = [containerId, "container"];
    if (searchAppend) containerOpt = [document.getElementById("searchContent"), "search"];
    if (prepend) { containerOpt[0].prepend(btnContainer); folderSuccessionLoaded[containerOpt[1]].currentItems.unshift([value, isFolder]) } else { containerOpt[0].append(btnContainer); folderSuccessionLoaded[containerOpt[1]].currentItems.push([value, isFolder]) }
}
function createAlert(contentName, extraContent, alertId) {
    if (localStorage.getItem("Unzipify-noAlert") !== null && localStorage.getItem("Unzipify-noAlert").indexOf(`-${alertId}`) !== -1) return;
    let alertContainer = document.createElement("div");
    alertContainer.classList.add("opacity", "alert");
    let alertContent = document.createElement("l");
    alertContent.textContent = contentName;
    let alertImg = document.createElement("img");
    alertImg.width = "28";
    alertImg.height = "28";
    alertImg.style.marginRight = "20px";
    getImg("alert", alertImg, getComputedStyle(document.body).getPropertyValue("--text"));
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
    setTimeout(() => { alertContainer.style.opacity = "1"; setTimeout(() => { removeItem(); }, parseInt(document.getElementById("alertChange").value)) }, 15);
}
function downloadItem(blob, contentName) {
    let a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = contentName;
    a.textContent = "Force download";
    a.click();
    a.style.marginLeft = "20px";
    createAlert("Download started!", a, "startDownload");
}
function readyValue(val) {
    return val.replace(folderSuccessionLoaded.ref, "");
}
function getFileName(path) {
    path = deleteAccidentalSlash(path);
    return path.substring(path.lastIndexOf("/") + 1);
}
function createRightButton(icon, customColor, backgroundColor) {
    let container = document.createElement("div");
    container.classList.add("circle");
    if (backgroundColor !== undefined) container.style.backgroundColor = backgroundColor;
    let img = document.createElement("img");
    img.classList.add("buttonImg");
    getImg(icon, img, customColor);
    container.append(img);
    return container;
}
function removeAnimation(item) {
    if (typeof (item) === "string") item = document.getElementById(item);
    let addClass = "noDisplayDialog";
    if (item.classList.contains("revDisplayDialog")) addClass = "revNoDisplayDialog";
    item.classList.remove("displayDialog", "revDisplayDialog");
    setTimeout(() => {
        item.classList.add(addClass);
        setTimeout(() => { item.classList.remove(addClass); item.style.display = "none" }, 600);
    }, 15);
}
for (let item of document.querySelectorAll("[data-fetch]")) getImg(item.getAttribute("data-fetch"), item);
document.getElementById("minimizeInner").addEventListener("click", () => {
    document.getElementById("jsMediaContainer").innerHTML = "";
    removeAnimation(document.getElementById("previewDialog"));
})
let currentIteration = 0;
document.getElementById("searchItem").addEventListener("input", () => {
    currentIteration++;
    let tempIteration = currentIteration;
    setTimeout(() => {
        if (tempIteration === currentIteration) {
            cleanItems(true);
            document.getElementById("fileSpinner").style.display = "block";
            let result = folderSuccessionLoaded.items.flat().filter(element => getFileName(element).toLowerCase().includes(document.getElementById("searchItem").value.toLowerCase()));
            switch (document.getElementById("checkSelect").value) {
                case "b":
                    result = result.filter(element => element.toLowerCase().startsWith(folderSuccessionLoaded.ref.toLowerCase()));
                    break;
                case "c":
                    result = result.filter(element => deleteAccidentalSlash(element).substring(0, deleteAccidentalSlash(element).lastIndexOf("/")).toLowerCase() === deleteAccidentalSlash(folderSuccessionLoaded.ref).toLowerCase());
                    break;
            }
            document.getElementById("searchContent").innerHTML = "";
            document.getElementById("fileSpinner").style.display = "none";
            for (let i = 0; i < result.length; i++) if (i < 50) createBtn(readyValue(result[i]), result[i], totalFiles[result[i]].dir, false, true); else folderSuccessionLoaded["search"].nextLoadItems.push([result[i], totalFiles[result[i]].dir]);

        }
    }, 150)
});
let generalDialogShow = {
    contentClick: [document.getElementById("minimizeFetch"), document.getElementById("tempsearch"), document.getElementById("minimizeFolder"), document.querySelector("[data-action=folderDialog]"), document.querySelector("[data-fetch=folderzip]"), document.querySelector("[data-action=addfolder]"), document.querySelector("[data-action=folderzip]"), document.getElementById("folderCreate"), document.querySelector("[data-action=downloadDialog]"), document.getElementById("minimizeDownload"), document.querySelector("[data-action=download]"), document.querySelector("[data-action=extract]"), document.querySelector("[data-action=settings]"), document.getElementById("minimizeSettings")],
    show: [false, true, false, true, false, true, false, false, true, false, false, false, true, false],
    ref: [document.getElementById("searchContainer"), document.getElementById("searchContainer"), document.getElementById("folderDialog"), document.getElementById("folderDialog"), document.getElementById("newFolderExclusive"), document.getElementById("newFolderExclusive"), document.getElementById("folderDialog"), document.getElementById("folderDialog"), document.getElementById("downloadDialog"), document.getElementById("downloadDialog"), document.getElementById("downloadDialog"), document.getElementById("downloadDialog"), document.getElementById("settingsDialog"), document.getElementById("settingsDialog")]
};
for (let i = 0; i < generalDialogShow.contentClick.length; i++) {
    if (generalDialogShow.show[i]) {
        generalDialogShow.contentClick[i].addEventListener("click", () => {
            generalDialogShow.ref[i].style.position = "absolute";
            if (generalDialogShow.ref[i].id !== "newFolderExclusive" || generalDialogShow.ref[i].id === "newFolderExclusive" && !generalDialogShow.show[i]) {
                generalDialogShow.ref[i].style.top = `${generalDialogShow.contentClick[i].getBoundingClientRect().bottom + 20}px`;
                generalDialogShow.ref[i].style.left = `${generalDialogShow.contentClick[i].getBoundingClientRect().left / 2}px`;
            }
            addAnimation(generalDialogShow.ref[i]);
        })
    } else {
        generalDialogShow.contentClick[i].addEventListener("click", () => { removeAnimation(generalDialogShow.ref[i]) })
    }
}
document.querySelector("[data-action=addFile]").addEventListener("click", () => {
    let input = document.createElement("input");
    input.type = "file";
    input.multiple = true;
    input.addEventListener("change", () => {
        uploadFile(input.files);
    });
    input.click();
})
function downloadZipItem(zipContent) {
    zipContent.generateAsync({ type: "blob", compression: "DEFLATE" })
        .then((content) => {
            // Append in case it doesn't download!
            downloadItem(content, "zip.zip");
            document.getElementById("fileSpinner").style.display = "none";

        });
}
document.querySelector("[data-action=download]").addEventListener("click", () => {
    document.getElementById("fileSpinner").style.display = "block";
    if (arrayPrev === "") {
        downloadZipItem(zip);
    } else {
        let newZip = new JSZip();
        let items = fetchArrayPrev();
        let i = 0;
        function loopAdvance() {
            i++;
            if (i < items.length) singleLoop(); else downloadZipItem(newZip);
        }
        function singleLoop() {
            if (items[i].replace(arrayPrev, "") !== "" && !items[i].endsWith("/")) {
                zip.file(items[i]).async("arraybuffer").then((result) => {
                    newZip.file(items[i].replace(arrayPrev, ""), new Blob([result]), { createFolders: true });
                    loopAdvance();
                })
            } else if (items[i].endsWith("/")) {
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
    function readItem() {
        let read = new FileReader();
        read.onload = () => {
            let relativePath = fileArray[i].name;
            if (isFolder) relativePath = fileArray[i].webkitRelativePath;
            zip.file(`${folderSuccessionLoaded.ref}${relativePath}`, new Blob([read.result]), { createFolders: true });
            i++;
            if (i < fileArray.length) readItem(); else { document.getElementById("fileSpinner").style.display = "none"; refreshEntry(); createAlert("Added file into the ZIP!", undefined, "zipAdd"); }
        }
        read.onerror = (error) => {
            console.warn(error);
            createAlert(`${read.error} [${fileArray[i].name}]`, undefined, "saveFileError");
            i++;
            if (i < fileArray.length) readItem(); else { document.getElementById("fileSpinner").style.display = "none"; refreshEntry(); createAlert("Added file into the ZIP!", undefined, "zipAdd"); }

        }
        read.readAsArrayBuffer(fileArray[i]);
    }
    readItem();
}
function refreshEntry() {
    if (folderSuccessionLoaded.isNew) totalFiles = zip.files;
    cleanItems(); folderSuccessionLoaded.items = []; document.getElementById("fileContainer").innerHTML = ""; improvedReader();
}
document.querySelector("[data-action=folderzip]").addEventListener("click", () => {
    let input = document.createElement("input");
    input.type = "file";
    for (let item of ["webkitdirectory", "multiple"]) input.setAttribute(item, "");
    input.addEventListener("change", () => {
        document.getElementById("fileSpinner").style.display = "block";
        uploadFile(input.files, true);
        document.getElementById("fileSpinner").style.display = "none";
    });
    input.click();
});
document.getElementById("folderCreate").addEventListener("click", () => {
    document.getElementById("fileSpinner").style.display = "block";
    zip.folder(`${folderSuccessionLoaded.ref}${document.getElementById("folderName").value}`);
    refreshEntry();
    document.getElementById("fileSpinner").style.display = "none";
});
let arrayPrev = "";
function fetchArrayPrev() {
    let zipContent = Object.keys(zip.files);
    return zipContent.filter(element => element.toLowerCase().startsWith(arrayPrev.toLowerCase()));
}
document.querySelector("[data-action=extract]").addEventListener("click", async () => {
    if (document.querySelector("[data-action=extract]").classList.contains("disabled")) return;
    document.getElementById("fileSpinner").style.display = "block";
    let zipContent = fetchArrayPrev();
    let userDir = await window.showDirectoryPicker();
    for (let item of zipContent) {
        let finalDir = userDir;
        let oldItem = item;
        item = item.replace(arrayPrev, "");
        if (item.split("/").length > 1) {
            let split = item.split("/");
            for (let i = 0; i < split.length - 1; i++) {
                finalDir = await finalDir.getDirectoryHandle(split[i], { create: true });
            }
        }
        if (!item.endsWith("/") && item !== "") {
            let fileHandle = await finalDir.getFileHandle(item.substring(item.lastIndexOf("/") + 1), { create: true });
            let writable = await fileHandle.createWritable();
            let fetchZip = await zip.file(oldItem).async("arraybuffer");
            await writable.write(fetchZip);
            await writable.close();
        }
    }
    document.getElementById("fileSpinner").style.display = "none";
    createAlert("Finished extracting zip file!", undefined, "zipExtractFinish");
});
document.querySelector("[data-action=next]").addEventListener("click", () => {
    if (document.querySelector("[data-fetch=next]").classList.contains("disabled")) return;
    document.getElementById("fileSpinner").style.display = "block";
    containerId.innerHTML = "";
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
document.querySelector("[data-action=downloadDialog]").addEventListener("click", () => {
    arrayPrev = "";
})
function addHoverEvents(item) {
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
for (let item of [...document.querySelectorAll("[data-change]"), ...document.getElementsByClassName("button"), ...document.querySelectorAll("input")]) addHoverEvents(item);
if (navigator.userAgent.toLowerCase().indexOf("safari") !== -1 && navigator.userAgent.toLowerCase().indexOf("chrome") === -1) document.querySelector("[data-action=extract]").classList.add("disabled");
let customOptions = {
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
let customThemes = [];
if (localStorage.getItem("Unzipify-customThemes") !== null) {
    try {
        customThemes = JSON.parse(localStorage.getItem("Unzipify-customThemes"))
    } catch (ex) {
        console.warn(ex);
    }
}
function createThemeOptions(theme, custom) {
    let themeContainer = document.createElement("div");
    themeContainer.classList.add("btnContainer", "heightAnimation");
    themeContainer.style = "width: 100%; background-color: var(--background); max-height: 45px";
    let leftDiv = document.createElement("div");
    leftDiv.classList.add("leftContent", "fillHeight");
    let leftText = document.createElement("l");
    leftText.textContent = theme.name;
    leftText.classList.add("heightAnimation");
    leftText.style = "max-height: 30px; overflow: scroll;";
    leftDiv.append(leftText);
    let rightContainer = document.createElement("div");
    if (custom) {
        let deleteBtn = createRightButton("delete", theme.color.accent, theme.color.row);
        deleteBtn.addEventListener("click", () => {
            customThemes.splice(customThemes.findIndex(theme => theme.themeIdentifier === theme.themeIdentifier), 1);
            localStorage.setItem("Unzipify-customThemes", JSON.stringify(customThemes));
            themeContainer.style.maxHeight = "0px";
            document.getElementById("themeContainer").style.maxHeight = `${parseInt(document.getElementById("themeContainer").style.maxHeight.replace("px", "")) - 60}px`;
            setTimeout(() => { themeContainer.remove() }, 210);
        });
        rightContainer.append(deleteBtn);
    }
    let applyBtn = createRightButton("color", theme.color.accent, theme.color.row);
    applyBtn.addEventListener("click", () => { checkAndApply(theme) });
    let downloadBtn = createRightButton("download", theme.color.accent, theme.color.row);
    downloadBtn.addEventListener("click", () => {
        downloadItem(new Blob([JSON.stringify(theme)], { type: "application/json" }), `${theme.name}-exported.json`);
    })
    rightContainer.classList.add("rightFlex");
    rightContainer.append(downloadBtn, applyBtn);
    themeContainer.append(leftDiv, rightContainer);
    document.getElementById("themeContainer").append(themeContainer);
    document.getElementById("themeContainer").style.maxHeight = `${parseInt(document.getElementById("themeContainer").style.maxHeight.replace("px", "")) + 60}px`;
}
for (let items of customOptions.defaultThemes) createThemeOptions(items);
for (let items of customThemes) createThemeOptions(items, true);
for (let items of document.querySelectorAll("[data-change]")) items.addEventListener("input", () => {
    document.documentElement.style.setProperty(`--${items.getAttribute("data-change")}`, items.value);
})
document.getElementById("saveTheme").addEventListener("click", () => {
    let name = prompt("Choose a name for this new theme:");
    if (name === undefined) return;
    let newItem = {
        name: name,
        color: {},
        themeIdentifier: new Date().toISOString()
    }
    for (let item of document.querySelectorAll("[data-change]")) newItem.color[item.getAttribute("data-change")] = item.value;
    customThemes.push(newItem);
    localStorage.setItem("Unzipify-customThemes", JSON.stringify(customThemes));
    createThemeOptions(newItem, true);
    checkAndApply(newItem);
});
function checkAndApply(theme, noApply) {
    if (theme.color === undefined) return;
    for (let colorId in theme.color) if (/^#[0-9A-F]{6}$/i.test(theme.color[colorId])) {
        document.documentElement.style.setProperty(`--${colorId}`, theme.color[colorId]);
        if (document.querySelector(`[data-change=${colorId}]`) !== null) document.querySelector(`[data-change=${colorId}]`).value = theme.color[colorId];
    }
    if (!noApply) localStorage.setItem("Unzipify-currentTheme", JSON.stringify(theme));
    for (let item of document.querySelectorAll("[data-fetch]")) getImg(item.getAttribute("data-fetch"), item);
}
if (localStorage.getItem("Unzipify-currentTheme") !== null) checkAndApply(JSON.parse(localStorage.getItem("Unzipify-currentTheme"))); else checkAndApply(customOptions.defaultThemes[1])
document.getElementById("importTheme").addEventListener("click", () => {
    let input = document.createElement("input");
    input.type = "file";
    input.onchange = (() => {
        let read = new FileReader();
        read.onload = (() => {
            checkAndApply(JSON.parse(read.result), true);
            createAlert("Theme imported! Make sure to save it so that you won't need to import it again", undefined, "importedTheme");
        });
        read.readAsText(input.files[0]);
    });
    input.click();
})
document.querySelector("[data-change=accent]").addEventListener("change", () => {
    for (let item of document.querySelectorAll("[data-fetch]")) getImg(item.getAttribute("data-fetch"), item);
})
document.getElementById("alertChange").addEventListener("input", () => {
    localStorage.setItem("Unzipify-alertDuration", document.getElementById("alertChange").value);
});
let valueCheck = {
    localItem: ["Unzipify-alertDuration"],
    ref: [document.getElementById("alertChange")],
    changeType: ["value"]
};
for (let i = 0; i < valueCheck.localItem.length; i++) if (localStorage.getItem(valueCheck.localItem[i]) !== null) valueCheck.ref[i][valueCheck.changeType[i]] = localStorage.getItem(valueCheck.localItem[i]);
document.getElementById("openSource").addEventListener("click", () => {
    fetch("./OpenSource.md").then((res) => {
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
}
let installationPrompt;
window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    installationPrompt = event;
});
document.getElementById("pwaBtn").addEventListener("click", () => {
    installationPrompt.prompt();
    installationPrompt.userChoice.then(choice => {
        if (choice.outcome === "accepted") document.getElementById("pwaTab").style.display = "none";
    });
});
if (window.matchMedia('(display-mode: standalone)').matches) document.getElementById("pwaTab").style.display = "none";
function generateHover() {
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
