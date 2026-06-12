let totalData = [];
let filteredData = [];
const itemsPerPage = 10;
let currentPage = 1;
let selectedItemName = null;

const listElement = document.getElementById('data-list');
const pageInfo = document.getElementById('page-info');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const searchField = document.querySelector('.search-field');
const loadingBar = document.getElementById('loading-bar');

const dialog = document.getElementById('detail-dialog');
const dialogTitle = document.getElementById('dialog-title');
const dialogImg = document.getElementById('dialog-img');
const dialogImgLoading = document.getElementById('dialog-img-loading');
const dialogInfoText = document.getElementById('dialog-info-text');
const dialogDownloadBtn = document.getElementById('dialog-download-btn');
const dialogCancelBtn = document.getElementById('dialog-cancel-btn');
const githubProxyBtn = document.getElementById('github-proxy-btn');

const proxyMenu= document.getElementById('menu-proxy');

const proxyDialog = document.getElementById('proxy-dialog');
const proxyDialogTitle = document.getElementById('proxy-dialog-title');
const proxyConfirmBtn = document.getElementById('proxy-confirm-btn');

const drawer = document.querySelector('.drawer');
const drawerBtn = document.querySelector('.drawer-btn');
const rightDrawerBtn = document.querySelector('.right-drawer-btn');
const rightDrawer = document.querySelector('.drawer-right');

async function loadData() {
    loadingBar.style.display = 'block';
    try {
        const response = await fetch('./data.json');
        totalData = await response.json();
        filteredData = totalData;
        renderList();
    } catch (error) {
        totalData = [];
        filteredData = [];
        renderList();
    }
    loadingBar.style.display = 'none';
}

function renderList() {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pageData = filteredData.slice(start, end);

    listElement.innerHTML = '';
    if (pageData.length === 0) {
        listElement.innerHTML = '<mdui-list-item>暂无数据</mdui-list-item>';
    } else {
        pageData.forEach((item) => {
            const listItem = document.createElement('mdui-list-item');
            listItem.setAttribute('headline-line', '1');
            listItem.setAttribute('description-line', '1');
            listItem.style.padding = "0";

            const contentDiv = document.createElement('div');
            contentDiv.style.display = 'flex';
            contentDiv.style.width = '100%';
            contentDiv.style.alignItems = 'center';
            contentDiv.style.justifyContent = 'space-between';
            contentDiv.style.cursor = 'pointer';

            const textDiv = document.createElement('div');
            textDiv.style.flex = '1';
            textDiv.style.minWidth = '0';
            textDiv.innerHTML = `
                        <span class="item-name">${item.name}</span>
                        <span class="desc-text font" style="display: block;">${item.desc}</span>
                    `;

            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'item-actions';
            const copyBtn = document.createElement('mdui-button-icon');
            copyBtn.setAttribute('icon', 'content_copy--outlined');
            copyBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                copyShareLink(item.name);
            });
            actionsDiv.appendChild(copyBtn);

            contentDiv.appendChild(textDiv);
            contentDiv.appendChild(actionsDiv);

            listItem.appendChild(contentDiv);

            if (selectedItemName && item.name === selectedItemName) {
                listItem.classList.add('highlighted-item');
                setTimeout(() => listItem.scrollIntoView({ behavior: 'smooth', block: 'center' }), 0);
            }
            listItem.addEventListener('click', () => showDetails(item));
            listElement.appendChild(listItem);
        });
    }

    const totalPages = Math.max(1, Math.ceil(filteredData.length / itemsPerPage));
    pageInfo.textContent = `第 ${currentPage} / ${totalPages} 页`;

    prevBtn.disabled = currentPage === 1;
    nextBtn.disabled = currentPage === totalPages || totalPages === 0;
}

function getHashItemName() {
    const hash = decodeURIComponent(window.location.hash.slice(1) || '').trim();
    return hash || null;
}

function openHashItem() {
    const hashName = getHashItemName();
    if (!hashName || filteredData.length === 0) {
        return;
    }

    const targetIndex = filteredData.findIndex(item => (item.name || '').toLowerCase() === hashName.toLowerCase());
    if (targetIndex === -1) {
        return;
    }

    const targetItem = filteredData[targetIndex];
    const targetPage = Math.floor(targetIndex / itemsPerPage) + 1;
    currentPage = targetPage;
    selectedItemName = targetItem.name;
    renderList();
    showDetails(targetItem);
}

function showDetails(item) {
    dialogTitle.textContent = item.name;
    const infoRaw = item.info || item.desc || "";

    if (infoRaw.startsWith("md#")) {
        const mdContent = infoRaw.substring(3);
        try {
            dialogInfoText.innerHTML = window.marked.parse(mdContent);
        } catch (e) {
            dialogInfoText.textContent = mdContent;
        }
    } else {
        dialogInfoText.innerHTML = infoRaw.replace(/\n/g, '<br>');
    }

    dialogImg.style.display = 'none';
    if (dialogImgLoading) dialogImgLoading.style.display = 'block';

    const isGithubRelease = item.href.includes('github.com') && item.href.includes('/releases/');
    githubProxyBtn.style.display = isGithubRelease ? 'inline-block' : 'none';

    const imgPathPng = `./img/${item.name}.png`;
    const imgPathJpg = `./img/${item.name}.jpg`;
    const img = new Image();
    img.onload = () => {
        dialogImg.src = img.src;
        dialogImg.style.display = 'block';
        if (dialogImgLoading) dialogImgLoading.style.display = 'none';
    };
    img.onerror = () => {
        if (img.src.endsWith('.jpg')) {
            img.src = imgPathPng;
        } else {
            dialogImg.style.display = 'none';
            if (dialogImgLoading) dialogImgLoading.style.display = 'none';
        }
    };
    img.src = imgPathJpg;

    dialogDownloadBtn.onclick = () => {
        window.open(item.href, '_blank');
        dialog.open = false;
    };
    dialogCancelBtn.onclick = () => dialog.open = false;

    githubProxyBtn.onclick = () => {
        proxyMenu.open = true
        window.dest = item.href;
    };

    dialog.open = true;
}

prevBtn.addEventListener('click', () => {
    if (currentPage > 1) {
        currentPage--;
        renderList();
    }
});

nextBtn.addEventListener('click', () => {
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    if (currentPage < totalPages) {
        currentPage++;
        renderList();
    }
});

searchField.addEventListener('input', (e) => {
    const keyword = e.target.value.toLowerCase().trim();
    if (keyword === '') {
        filteredData = totalData;
    } else {
        filteredData = totalData.filter(item => {
            return (item.name || "").toLowerCase().includes(keyword) ||
                (item.desc || "").toLowerCase().includes(keyword) ||
                (item.info || "").toLowerCase().includes(keyword);
        });
    }
    currentPage = 1;
    renderList();
});

drawerBtn.addEventListener('click', () => {
    rightDrawer.open = false;
    drawer.open = !drawer.open;
});

rightDrawerBtn.addEventListener('click', () => {
    drawer.open = false;
    rightDrawer.open = !rightDrawer.open;
});

function copyShareLink(itemName) {
    const shareUrl = window.location.origin + window.location.pathname + '#' + encodeURIComponent(itemName);
    navigator.clipboard.writeText(shareUrl).then(() => {
        mdui.snackbar({
            message: "已复制链接"
        });
    }).catch(() => {
        mdui.snackbar({
            message: "复制失败"
        });
    });
}

function proxyDownload(proxy) {
    window.open('https://' + proxy + '/' + window.dest, '_blank');
}

function proxyDownloadAbout() {
    mdui.dialog({
        headline: '什么是代理下载？',
        description: '代理下载就是通过异地节点代理访问 Github 的服务器，在某些情况可以提高 Github 资源下载速度。如果某个节点无法下载或下载过慢，你可以尝试切换其他的节点下载',
        closeOnOverlayClick: true
    });
}

window.addEventListener('hashchange', openHashItem);
loadData().then(openHashItem);