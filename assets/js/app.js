document.addEventListener('DOMContentLoaded',()=>{
  if(window.lucide)lucide.createIcons();
  const menu=document.getElementById('menuBtn');
  const sidebar=document.getElementById('sidebar');
  const setMenu=(open)=>{
    if(!sidebar)return;
    sidebar.classList.toggle('open',open);
    if(menu)menu.setAttribute('aria-expanded',String(open));
  };
  if(menu&&sidebar){
    menu.addEventListener('click',()=>setMenu(!sidebar.classList.contains('open')));
    sidebar.querySelectorAll('a').forEach(link=>link.addEventListener('click',()=>setMenu(false)));
    document.addEventListener('click',event=>{
      if(sidebar.classList.contains('open')&&!sidebar.contains(event.target)&&!event.target.closest('#menuBtn'))setMenu(false);
    });
    document.addEventListener('keydown',event=>{if(event.key==='Escape')setMenu(false);});
  }

  // Shared modal dismissal and keyboard focus management for all workspace dialogs.
  const getOpenModal=()=>document.querySelector('.modal-backdrop.open');
  document.addEventListener('click',event=>{
    const backdrop=event.target.closest('.modal-backdrop.open');
    if(backdrop&&event.target===backdrop){
      backdrop.remove();
    }
  });
  document.addEventListener('keydown',event=>{
    const modal=getOpenModal();
    if(!modal)return;
    if(event.key==='Escape'){
      event.preventDefault();
      modal.remove();
      return;
    }
    if(event.key==='Tab'){
      const items=[...modal.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])')].filter(el=>el.offsetParent!==null);
      if(!items.length){event.preventDefault();return;}
      const first=items[0],last=items[items.length-1];
      if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
      else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
    }
  });
  const modalObserver=new MutationObserver(records=>{
    for(const record of records){
      for(const node of record.addedNodes){
        if(node.nodeType===1&&node.matches('.modal-backdrop.open')){
          const first=node.querySelector('input:not([disabled]),select:not([disabled]),textarea:not([disabled]),button:not([disabled])');
          if(first)first.focus();
        }
      }
    }
  });
  modalObserver.observe(document.body,{childList:true});

  const btn=document.getElementById('newCampaign');
  const toast=document.getElementById('toast');
  if(btn&&toast)btn.addEventListener('click',()=>{
    toast.classList.add('show');
    setTimeout(()=>toast.classList.remove('show'),2600);
  });
});