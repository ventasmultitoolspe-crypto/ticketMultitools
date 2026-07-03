// =============================================
// LIMPIAR CACHÉ DE LOCALSTORAGE
// =============================================

(function limpiarCacheLocal() {
    const version = '8.0';
    const versionGuardada = localStorage.getItem('multitools_version');
    
    if (versionGuardada !== version) {
        console.log('🔄 Limpiando caché local - Nueva versión: ' + version);
        localStorage.removeItem('multitools_registros');
        localStorage.setItem('multitools_version', version);
        
        if (!window.location.search.includes('_clean=true')) {
            const separator = window.location.search ? '&' : '?';
            window.location.href = window.location.href + separator + '_clean=true';
            return;
        }
    }
})();

// =============================================
// CONFIGURACION
// =============================================

const CONFIG = {
    whatsapp: "907008110",
    remitente: {
        nombre: "Alexander Vasquez",
        empresa: "MULTITOOLS",
        ruc: "20611590696",
        celular: "907008110"
    }
};

console.log('✅ Sistema v8.0 cargado - ' + new Date().toLocaleString());

// =============================================
// FUNCIONES DE CODIFICACION
// =============================================

function codificarDatos(datos) {
    try {
        const json = JSON.stringify(datos);
        return btoa(encodeURIComponent(json));
    } catch (e) {
        console.error('Error al codificar:', e);
        return null;
    }
}

function decodificarDatos(dataEncoded) {
    try {
        const json = decodeURIComponent(atob(dataEncoded));
        return JSON.parse(json);
    } catch (e) {
        console.error('Error al decodificar:', e);
        return null;
    }
}

// =============================================
// GUARDAR EN LOCALSTORAGE
// =============================================

let datosActuales = null;
let timeoutGuardado = null;

function guardarLocal(datos) {
    const registros = JSON.parse(localStorage.getItem('multitools_registros') || '{}');
    registros[datos.id] = datos;
    localStorage.setItem('multitools_registros', JSON.stringify(registros));
}

function obtenerLocal(id) {
    const registros = JSON.parse(localStorage.getItem('multitools_registros') || '{}');
    return registros[id] || null;
}

// =============================================
// GUARDADO AUTOMÁTICO
// =============================================

function guardarCambiosAutomatico() {
    if (!datosActuales) return;
    
    const nombre = document.getElementById('tNombre')?.textContent.trim() || '';
    const dni = document.getElementById('tDni')?.textContent.trim() || '';
    const celular = document.getElementById('tCelular')?.textContent.trim() || '';
    const agencia = document.getElementById('tAgencia')?.textContent.trim() || '';
    const pedido = document.getElementById('tPedido')?.textContent.trim() || '';
    
    if (datosActuales.nombre === nombre && 
        datosActuales.dni === dni && 
        datosActuales.celular === celular && 
        datosActuales.agencia === agencia && 
        datosActuales.pedido === pedido) {
        return;
    }
    
    datosActuales.nombre = nombre || 'No especificado';
    datosActuales.dni = dni || 'No especificado';
    datosActuales.celular = celular || 'No especificado';
    datosActuales.agencia = agencia || 'No especificado';
    datosActuales.pedido = pedido || 'Sin pedido';
    datosActuales.fecha_edicion = new Date().toISOString();
    
    guardarLocal(datosActuales);
    
    const datosEncoded = codificarDatos(datosActuales);
    const nuevaUrl = window.location.origin + window.location.pathname + '?data=' + datosEncoded;
    window.history.replaceState({}, '', nuevaUrl);
    
    const indicator = document.getElementById('autoSaveIndicator');
    if (indicator) {
        indicator.style.display = 'block';
        indicator.textContent = '✓ Cambios guardados ' + new Date().toLocaleTimeString();
        clearTimeout(timeoutGuardado);
        timeoutGuardado = setTimeout(() => {
            indicator.style.display = 'none';
        }, 2000);
    }
    
    console.log('💾 Cambios guardados automáticamente');
}

// =============================================
// REFERENCIAS DOM
// =============================================

const formulario = document.getElementById('formulario');
const ticket = document.getElementById('ticket');
const btnImprimirTicket = document.getElementById('btnImprimirTicket');

const tNombre = document.getElementById('tNombre');
const tDni = document.getElementById('tDni');
const tCelular = document.getElementById('tCelular');
const tAgencia = document.getElementById('tAgencia');
const tPedido = document.getElementById('tPedido');
const tFechaHora = document.getElementById('tFechaHora');

const nombreInput = document.getElementById('nombre');
const dniInput = document.getElementById('dni');
const celularInput = document.getElementById('celular');
const agenciaInput = document.getElementById('agencia');
const pedidoInput = document.getElementById('pedido');

// =============================================
// BUSCADOR DE AGENCIAS SHALOM
// =============================================

const buscadorInput = document.getElementById('buscarAgencia');
const listaResultados = document.getElementById('listaAgencias');

// LISTA COMPLETA DE AGENCIAS SHALOM
const agenciasShalom = [
    "chachapoyas co dos de mayo",
    "amazonas / chachapoyas / chachapoyas / chachapoyas co dos de mayo",
    "chachapoyas jr grau",
    "amazonas / chachapoyas / chachapoyas / chachapoyas jr grau",
    "bagua capital",
    "amazonas / bagua / bagua / bagua capital",
    "pedro ruiz",
    "amazonas / bongara / jazan / pedro ruiz",
    "luya",
    "amazonas / luya / luya / luya",
    "bagua grande",
    "amazonas / utcubamba / bagua grande / bagua grande",
    "huaraz",
    "ancash / huaraz / huaraz / huaraz",
    "carhuaz",
    "ancash / carhuaz / carhuaz / carhuaz",
    "casma",
    "ancash / casma / casma / casma",
    "huarmey",
    "ancash / huarmey / huarmey / huarmey",
    "caraz",
    "ancash / huaylas / caraz / caraz",
    "av enrique meiggs",
    "ancash / santa / chimbote / av enrique meiggs",
    "av jose galvez",
    "ancash / santa / chimbote / av jose galvez",
    "av. los pescadores co",
    "ancash / santa / chimbote / av. los pescadores co",
    "santa",
    "ancash / santa / santa / santa",
    "ovalo de la familia",
    "ancash / santa / nuevo chimbote / ovalo de la familia",
    "tres de octubre",
    "ancash / santa / nuevo chimbote / tres de octubre",
    "garatea",
    "ancash / santa / nuevo chimbote / garatea",
    "av. pacífico belen",
    "ancash / santa / nuevo chimbote / av. pacífico belen",
    "yungay",
    "ancash / yungay / yungay / yungay",
    "abancay",
    "apurimac / abancay / abancay / abancay",
    "andahuaylas",
    "apurimac / andahuaylas / andahuaylas / andahuaylas",
    "challhuahuacho",
    "apurimac / cotabambas / challhuahuacho / challhuahuacho",
    "av parra 379 co",
    "arequipa / arequipa / arequipa / av parra 379 co",
    "mall lambramani",
    "arequipa / arequipa / arequipa / mall lambramani",
    "av lima",
    "arequipa / arequipa / alto selva alegre / av lima",
    "av augusto salazar bondy",
    "arequipa / arequipa / alto selva alegre / av augusto salazar bondy",
    "plaza la tomilla",
    "arequipa / arequipa / cayma / plaza la tomilla",
    "av charcani",
    "arequipa / arequipa / cayma / av charcani",
    "ciudad municipal",
    "arequipa / arequipa / cerro colorado / ciudad municipal",
    "asoc las flores - av 54",
    "arequipa / arequipa / cerro colorado / asoc las flores - av 54",
    "av pumacahua",
    "arequipa / arequipa / cerro colorado / av pumacahua",
    "zamacola",
    "arequipa / arequipa / cerro colorado / zamacola",
    "av los incas",
    "arequipa / arequipa / cerro colorado / av los incas",
    "autopista la joya",
    "arequipa / arequipa / cerro colorado / autopista la joya",
    "asoc. nuevo horizonte - av. 54",
    "arequipa / arequipa / cerro colorado / asoc. nuevo horizonte - av. 54",
    "jacobo hunter",
    "arequipa / arequipa / jacobo hunter / jacobo hunter",
    "el cruce la joya",
    "arequipa / arequipa / la joya / el cruce la joya",
    "mariano melgar",
    "arequipa / arequipa / mariano melgar / mariano melgar",
    "miraflores arequipa",
    "arequipa / arequipa / miraflores / miraflores arequipa",
    "urb manuel prado",
    "arequipa / arequipa / paucarpata / urb manuel prado",
    "av jesus",
    "arequipa / arequipa / paucarpata / av jesus",
    "av socabaya - los toritos",
    "arequipa / arequipa / socabaya / av socabaya - los toritos",
    "av. horacio zevallos",
    "arequipa / arequipa / socabaya / av. horacio zevallos",
    "uchumayo",
    "arequipa / arequipa / uchumayo / uchumayo",
    "yura",
    "arequipa / arequipa / yura / yura",
    "camana",
    "arequipa / camana / camana / camana",
    "chala",
    "arequipa / caraveli / chala / chala",
    "aplao",
    "arequipa / castilla / aplao / aplao",
    "calle yarabamba",
    "arequipa / caylloma / majes / calle yarabamba",
    "av colonizadores co",
    "arequipa / caylloma / majes / av colonizadores co",
    "mollendo co",
    "arequipa / islay / mollendo / mollendo co",
    "cocachacra",
    "arequipa / islay / cocachacra / cocachacra",
    "matarani",
    "arequipa / islay / islay / matarani",
    "ayacucho co",
    "ayacucho / huamanga / ayacucho / ayacucho co",
    "carmen alto",
    "ayacucho / huamanga / carmen alto / carmen alto",
    "san juan bautista",
    "ayacucho / huamanga / san juan bautista / san juan bautista",
    "jesus nazareno",
    "ayacucho / huamanga / jesus nazareno / jesus nazareno",
    "huanta",
    "ayacucho / huanta / huanta / huanta",
    "cajamarca co",
    "cajamarca / cajamarca / cajamarca / cajamarca co",
    "cajamarca horacio zevallos",
    "cajamarca / cajamarca / cajamarca / cajamarca horacio zevallos",
    "barrio san jose",
    "cajamarca / cajamarca / cajamarca / barrio san jose",
    "huambocancha baja",
    "cajamarca / cajamarca / cajamarca / huambocancha baja",
    "barrio san martín",
    "cajamarca / cajamarca / cajamarca / barrio san martín",
    "huaraclla",
    "cajamarca / cajamarca / jesus / huaraclla",
    "baños del inca",
    "cajamarca / cajamarca / los banos del inca / baños del inca",
    "cajabamba",
    "cajamarca / cajabamba / cajabamba / cajabamba",
    "celendin",
    "cajamarca / celendin / celendin / celendin",
    "chota",
    "cajamarca / chota / chota / chota",
    "chilete - agente",
    "cajamarca / contumaza / chilete / chilete - agente",
    "tembladera cajamarca",
    "cajamarca / contumaza / yonan / tembladera cajamarca",
    "cutervo",
    "cajamarca / cutervo / cutervo / cutervo",
    "bambamarca",
    "cajamarca / hualgayoc / bambamarca / bambamarca",
    "jaen",
    "cajamarca / jaen / jaen / jaen",
    "san ignacio",
    "cajamarca / san ignacio / san ignacio / san ignacio",
    "san marcos",
    "cajamarca / san marcos / pedro galvez / san marcos",
    "san miguel cajamarca",
    "cajamarca / san miguel / san miguel / san miguel cajamarca",
    "san pablo cajamarca",
    "cajamarca / san pablo / san pablo / san pablo cajamarca",
    "callao faucett",
    "callao / callao / callao / callao faucett",
    "av quilca",
    "callao / callao / callao / av quilca",
    "av bertello callao",
    "callao / callao / callao / av bertello callao",
    "av saenz peña",
    "callao / callao / callao / av saenz peña",
    "bellavista callao",
    "callao / callao / bellavista / bellavista callao",
    "ovalo la perla",
    "callao / callao / la perla / ovalo la perla",
    "parad. los licenciados",
    "callao / callao / ventanilla / parad. los licenciados",
    "pachacutec pdro chinitas",
    "callao / callao / ventanilla / pachacutec pdro chinitas",
    "pachacutec pdro vc",
    "callao / callao / ventanilla / pachacutec pdro vc",
    "pachacutec av 150",
    "callao / callao / ventanilla / pachacutec av 150",
    "mi peru",
    "callao / callao / mi peru / mi peru",
    "tica tica",
    "cusco / cusco / cusco / tica tica",
    "san jeronimo",
    "cusco / cusco / san jeronimo / san jeronimo",
    "cachimayo - san sebastian",
    "cusco / cusco / san sebastian / cachimayo - san sebastian",
    "via expresa sur",
    "cusco / cusco / san sebastian / via expresa sur",
    "cusco co via evitamiento",
    "cusco / cusco / san sebastian / cusco co via evitamiento",
    "av antonio lorena",
    "cusco / cusco / santiago / av antonio lorena",
    "urb. bancopata av. industrial",
    "cusco / cusco / santiago / urb. bancopata av. industrial",
    "huancaro",
    "cusco / cusco / santiago / huancaro",
    "cusco parque industrial",
    "cusco / cusco / wanchaq / cusco parque industrial",
    "av pachacutec",
    "cusco / cusco / wanchaq / av pachacutec",
    "velasco astete",
    "cusco / cusco / wanchaq / velasco astete",
    "anta izcuchaca",
    "cusco / anta / anta / anta izcuchaca",
    "cusco calca",
    "cusco / calca / calca / cusco calca",
    "pisac",
    "cusco / calca / pisac / pisac",
    "sicuani co ovalo san andres",
    "cusco / canchis / sicuani / sicuani co ovalo san andres",
    "sicuani av manuel callo",
    "cusco / canchis / sicuani / sicuani av manuel callo",
    "combapata",
    "cusco / canchis / combapata / combapata",
    "santo tomas",
    "cusco / chumbivilcas / santo tomas / santo tomas",
    "espinar",
    "cusco / espinar / yauri ( espinar ) / espinar",
    "quillabamba",
    "cusco / la convencion / santa ana / quillabamba",
    "urcos",
    "cusco / quispicanchi / urcos / urcos",
    "ocongate",
    "cusco / quispicanchi / ocongate / ocongate",
    "oropesa",
    "cusco / quispicanchi / oropesa / oropesa",
    "cusco urubamba",
    "cusco / urubamba / urubamba / cusco urubamba",
    "chinchero",
    "cusco / urubamba / chinchero / chinchero",
    "huancavelica",
    "huancavelica / huancavelica / huancavelica / huancavelica",
    "jr aguilar",
    "huanuco / huanuco / huanuco / jr aguilar",
    "amarilis co",
    "huanuco / huanuco / amarilis / amarilis co",
    "ambo",
    "huanuco / ambo / ambo / ambo",
    "tingo maria co buenos aires",
    "huanuco / leoncio prado / rupa rupa / tingo maria co buenos aires",
    "tingo maría - leoncio prado",
    "huanuco / leoncio prado / rupa rupa / tingo maría - leoncio prado",
    "aucayacu",
    "huanuco / leoncio prado / jose crespo y castil / aucayacu",
    "ica san joaquin",
    "ica / ica / ica / ica san joaquin",
    "ica av. jj elias",
    "ica / ica / ica / ica av. jj elias",
    "ica urb. manzanilla",
    "ica / ica / ica / ica urb. manzanilla",
    "la tinguiña",
    "ica / ica / la tinguina / la tinguiña",
    "parcona",
    "ica / ica / parcona / parcona",
    "salas ica",
    "ica / ica / salas / salas ica",
    "ica santiago",
    "ica / ica / santiago / ica santiago",
    "ica subtanjalla co",
    "ica / ica / subtanjalla / ica subtanjalla co",
    "prolong luis massaro",
    "ica / chincha / chincha alta / prolong luis massaro",
    "calle los angeles",
    "ica / chincha / chincha alta / calle los angeles",
    "chincha pueblo nuevo",
    "ica / chincha / pueblo nuevo / chincha pueblo nuevo",
    "sunampe co",
    "ica / chincha / sunampe / sunampe co",
    "av circunvalacion nazca",
    "ica / nazca / nazca / av circunvalacion nazca",
    "san juan de marcona",
    "ica / nazca / marcona / san juan de marcona",
    "vista alegre co",
    "ica / nazca / vista alegre / vista alegre co",
    "av abraham valdelomar co",
    "ica / pisco / pisco / av abraham valdelomar co",
    "la villa cruce pisco",
    "ica / pisco / pisco / la villa cruce pisco",
    "san clemente",
    "ica / pisco / san clemente / san clemente",
    "huancayo jr. ica",
    "junin / huancayo / huancayo / huancayo jr. ica",
    "terminal los andes",
    "junin / huancayo / huancayo / terminal los andes",
    "san carlos huancayo",
    "junin / huancayo / huancayo / san carlos huancayo",
    "chilca huancayo",
    "junin / huancayo / chilca / chilca huancayo",
    "chilca leoncio prado",
    "junin / huancayo / chilca / chilca leoncio prado",
    "av mariscal castilla co parque industrial",
    "junin / huancayo / el tambo / av mariscal castilla co parque industrial",
    "pio pata",
    "junin / huancayo / el tambo / pio pata",
    "av circunvalación cruce con mariategui",
    "junin / huancayo / el tambo / av circunvalación cruce con mariategui",
    "ciudad universitaria",
    "junin / huancayo / el tambo / ciudad universitaria",
    "pilcomayo",
    "junin / huancayo / pilcomayo / pilcomayo",
    "san agustin de cajas",
    "junin / huancayo / san agustin / san agustin de cajas",
    "concepcion",
    "junin / concepcion / concepcion / concepcion",
    "la merced",
    "junin / chanchamayo / la merced / la merced",
    "perene",
    "junin / chanchamayo / perene / perene",
    "pichanaki",
    "junin / chanchamayo / bajo pichanaqui / pichanaki",
    "san ramón",
    "junin / chanchamayo / san ramon / san ramón",
    "jauja",
    "junin / jauja / jauja / jauja",
    "terminal jauja",
    "junin / jauja / jauja / terminal jauja",
    "satipo",
    "junin / satipo / satipo / satipo",
    "mazamari",
    "junin / satipo / mazamari / mazamari",
    "pangoa",
    "junin / satipo / pangoa / pangoa",
    "tarma",
    "junin / tarma / tarma / tarma",
    "la oroya",
    "junin / yauli / la oroya / la oroya",
    "chupaca",
    "junin / chupaca / chupaca / chupaca",
    "calle liverpool",
    "la libertad / trujillo / trujillo / calle liverpool",
    "trujillo la perla",
    "la libertad / trujillo / trujillo / trujillo la perla",
    "atahualpa",
    "la libertad / trujillo / trujillo / atahualpa",
    "calle santa cruz - america sur",
    "la libertad / trujillo / trujillo / calle santa cruz - america sur",
    "av hnos uceda - america norte",
    "la libertad / trujillo / trujillo / av hnos uceda - america norte",
    "ovalo papal",
    "la libertad / trujillo / trujillo / ovalo papal",
    "av hermanos angulo",
    "la libertad / trujillo / el porvenir / av hermanos angulo",
    "alto trujillo",
    "la libertad / trujillo / el porvenir / alto trujillo",
    "av. las magnolias",
    "la libertad / trujillo / el porvenir / av. las magnolias",
    "jr. cahuide",
    "la libertad / trujillo / el porvenir / jr. cahuide",
    "ovalo huanchaco co",
    "la libertad / trujillo / huanchaco / ovalo huanchaco co",
    "el milagro",
    "la libertad / trujillo / huanchaco / el milagro",
    "av tahuantinsuyo",
    "la libertad / trujillo / la esperanza / av tahuantinsuyo",
    "wichanzao",
    "la libertad / trujillo / la esperanza / wichanzao",
    "moche",
    "la libertad / trujillo / moche / moche",
    "paijan",
    "la libertad / ascope / paijan / paijan",
    "casa grande",
    "la libertad / ascope / casa grande / casa grande",
    "chepen",
    "la libertad / chepen / chepen / chepen",
    "pacanguilla",
    "la libertad / chepen / pacanga / pacanguilla",
    "otuzco",
    "la libertad / otuzco / otuzco / otuzco",
    "san pedro de lloc",
    "la libertad / pacasmayo / san pedro de lloc / san pedro de lloc",
    "ciudad de dios",
    "la libertad / pacasmayo / guadalupe / ciudad de dios",
    "guadalupe la libertad",
    "la libertad / pacasmayo / guadalupe / guadalupe la libertad",
    "pacasmayo las palmeras",
    "la libertad / pacasmayo / pacasmayo / pacasmayo las palmeras",
    "pacasmayo centro",
    "la libertad / pacasmayo / pacasmayo / pacasmayo centro",
    "huamachuco",
    "la libertad / sanchez carrion / huamachuco / huamachuco",
    "puente viru",
    "la libertad / viru / viru / puente viru",
    "viru centro",
    "la libertad / viru / viru / viru centro",
    "chao",
    "la libertad / viru / chao / chao",
    "miraflores chiclayo",
    "lambayeque / chiclayo / chiclayo / miraflores chiclayo",
    "mariscal nieto",
    "lambayeque / chiclayo / chiclayo / mariscal nieto",
    "av las americas",
    "lambayeque / chiclayo / chiclayo / av las americas",
    "chongoyape",
    "lambayeque / chiclayo / chongoyape / chongoyape",
    "calle tahuantinsuyo",
    "lambayeque / chiclayo / jose leonardo ortiz / calle tahuantinsuyo",
    "av balta cdra. 36",
    "lambayeque / chiclayo / jose leonardo ortiz / av balta cdra. 36",
    "av victor r. haya co",
    "lambayeque / chiclayo / la victoria / av victor r. haya co",
    "monsefu",
    "lambayeque / chiclayo / monsefu / monsefu",
    "pimentel",
    "lambayeque / chiclayo / pimentel / pimentel",
    "reque",
    "lambayeque / chiclayo / reque / reque",
    "patapo",
    "lambayeque / chiclayo / patapo / patapo",
    "pomalca",
    "lambayeque / chiclayo / pomalca / pomalca",
    "tuman",
    "lambayeque / chiclayo / tuman / tuman",
    "ferreñafe",
    "lambayeque / ferrenafe / ferrenafe / ferreñafe",
    "lambayeque panamericana",
    "lambayeque / lambayeque / lambayeque / lambayeque panamericana",
    "lambayeque centro",
    "lambayeque / lambayeque / lambayeque / lambayeque centro",
    "jayanca",
    "lambayeque / lambayeque / jayanca / jayanca",
    "morrope",
    "lambayeque / lambayeque / morrope / morrope",
    "motupe",
    "lambayeque / lambayeque / motupe / motupe",
    "olmos",
    "lambayeque / lambayeque / olmos / olmos",
    "tucume",
    "lambayeque / lambayeque / tucume / tucume",
    "malvinas - jr. ricardo treneman",
    "lima / lima / cercado lima / malvinas - jr. ricardo treneman",
    "malvinas - jr. garcia villón",
    "lima / lima / cercado lima / malvinas - jr. garcia villón",
    "lima av tingo maría",
    "lima / lima / cercado lima / lima av tingo maría",
    "av nicolas dueñas cdra. 5",
    "lima / lima / cercado lima / av nicolas dueñas cdra. 5",
    "ancon",
    "lima / lima / ancon / ancon",
    "huaycan entrada",
    "lima / lima / ate-vitarte / huaycan entrada",
    "av marco puente",
    "lima / lima / ate-vitarte / av marco puente",
    "puente santa anita",
    "lima / lima / ate-vitarte / puente santa anita",
    "huaycan av jose c mariategui",
    "lima / lima / ate-vitarte / huaycan av jose c mariategui",
    "los sauces",
    "lima / lima / ate-vitarte / los sauces",
    "santa clara",
    "lima / lima / ate-vitarte / santa clara",
    "av esperanza",
    "lima / lima / ate-vitarte / av esperanza",
    "av el sol",
    "lima / lima / ate-vitarte / av el sol",
    "huaycan el descanso",
    "lima / lima / ate-vitarte / huaycan el descanso",
    "urb santa elvira",
    "lima / lima / ate-vitarte / urb santa elvira",
    "huaycan av horacio zevallos",
    "lima / lima / ate-vitarte / huaycan av horacio zevallos",
    "av venezuela",
    "lima / lima / brena / av venezuela",
    "jr. huaraz - breña",
    "lima / lima / brena / jr. huaraz - breña",
    "carabayllo establo",
    "lima / lima / carabayllo / carabayllo establo",
    "tungasuca",
    "lima / lima / carabayllo / tungasuca",
    "av tupac amaru km. 19",
    "lima / lima / carabayllo / av tupac amaru km. 19",
    "av. tupac amaru km. 23.5",
    "lima / lima / carabayllo / av. tupac amaru km. 23.5",
    "av jose saco rojas",
    "lima / lima / carabayllo / av jose saco rojas",
    "santo domingo",
    "lima / lima / carabayllo / santo domingo",
    "el progreso km 22",
    "lima / lima / carabayllo / el progreso km 22",
    "chorrillos co",
    "lima / lima / chorrillos / chorrillos co",
    "chorrillos los faisanes",
    "lima / lima / chorrillos / chorrillos los faisanes",
    "las delicias de villa",
    "lima / lima / chorrillos / las delicias de villa",
    "megaplaza chorrillos",
    "lima / lima / chorrillos / megaplaza chorrillos",
    "cieneguilla km. 14.5",
    "lima / lima / cieneguilla / cieneguilla km. 14.5",
    "av univ. retablo",
    "lima / lima / comas / av univ. retablo",
    "av. trapiche",
    "lima / lima / comas / av. trapiche",
    "año nuevo",
    "lima / lima / comas / año nuevo",
    "av tupac amaru cdra. 57",
    "lima / lima / comas / av tupac amaru cdra. 57",
    "av. univ. parque sinchi roca",
    "lima / lima / comas / av. univ. parque sinchi roca",
    "urb. repartición",
    "lima / lima / comas / urb. repartición",
    "puente nuevo",
    "lima / lima / el agustino / puente nuevo",
    "jiron ancash",
    "lima / lima / el agustino / jiron ancash",
    "la cincuenta",
    "lima / lima / independencia / la cincuenta",
    "plaza norte entregas",
    "lima / lima / independencia / plaza norte entregas",
    "megaplaza independencia",
    "lima / lima / independencia / megaplaza independencia",
    "calle a con av industrial",
    "lima / lima / independencia / calle a con av industrial",
    "jesus maria",
    "lima / lima / jesus maria / jesus maria",
    "real plaza salaverry",
    "lima / lima / jesus maria / real plaza salaverry",
    "av la fontana",
    "lima / lima / la molina / av la fontana",
    "los fresnos",
    "lima / lima / la molina / los fresnos",
    "av. la molina cdra. 35",
    "lima / lima / la molina / av. la molina cdra. 35",
    "av flora tristan",
    "lima / lima / la molina / av flora tristan",
    "parque la molina",
    "lima / lima / la molina / parque la molina",
    "av alameda del corregidor",
    "lima / lima / la molina / av alameda del corregidor",
    "av mexico co",
    "lima / lima / la victoria / av mexico co",
    "jr. raymondi",
    "lima / lima / la victoria / jr. raymondi",
    "av. canada",
    "lima / lima / la victoria / av. canada",
    "jr casanova con petit thouars",
    "lima / lima / lince / jr casanova con petit thouars",
    "av jose leal cdra 6",
    "lima / lima / lince / av jose leal cdra 6",
    "av. las palmeras",
    "lima / lima / los olivos / av. las palmeras",
    "pro",
    "lima / lima / los olivos / pro",
    "av. angelica gamarra",
    "lima / lima / los olivos / av. angelica gamarra",
    "av huandoy con marañon",
    "lima / lima / los olivos / av huandoy con marañon",
    "av. dos de octubre",
    "lima / lima / los olivos / av. dos de octubre",
    "av. carlos izaguirre cdra. 14",
    "lima / lima / los olivos / av. carlos izaguirre cdra. 14",
    "av. los platinos",
    "lima / lima / los olivos / av. los platinos",
    "av huandoy con av central",
    "lima / lima / los olivos / av huandoy con av central",
    "chosica",
    "lima / lima / lurigancho / chosica",
    "huachipa co",
    "lima / lima / lurigancho / huachipa co",
    "santa maría de huachipa",
    "lima / lima / lurigancho / santa maría de huachipa",
    "nuevo lurin",
    "lima / lima / lurin / nuevo lurin",
    "puente lurin",
    "lima / lima / lurin / puente lurin",
    "magdalena del mar",
    "lima / lima / magdalena del mar / magdalena del mar",
    "av. la marina",
    "lima / lima / pueblo libre / av. la marina",
    "av bolivar",
    "lima / lima / pueblo libre / av bolivar",
    "larcomar",
    "lima / lima / miraflores / larcomar",
    "la curva de manchay",
    "lima / lima / pachacamac / la curva de manchay",
    "manchay tres marias",
    "lima / lima / pachacamac / manchay tres marias",
    "av manuel valle",
    "lima / lima / pachacamac / av manuel valle",
    "puente arica",
    "lima / lima / puente piedra / puente arica",
    "zapallal",
    "lima / lima / puente piedra / zapallal",
    "av. san lorenzo",
    "lima / lima / puente piedra / av. san lorenzo",
    "ovalo puente piedra",
    "lima / lima / puente piedra / ovalo puente piedra",
    "av buenos aires",
    "lima / lima / puente piedra / av buenos aires",
    "punta hermosa",
    "lima / lima / punta hermosa / punta hermosa",
    "rimac av. amancaes",
    "lima / lima / rimac / rimac av. amancaes",
    "rimac guardia republicana cdra. 9",
    "lima / lima / rimac / rimac guardia republicana cdra. 9",
    "aviacion 2819",
    "lima / lima / san borja / aviacion 2819",
    "av. angamos",
    "lima / lima / san borja / av. angamos",
    "av santa rosa urb los alamos",
    "lima / lima / san juan de lurigancho / av santa rosa urb los alamos",
    "av. 13 de enero",
    "lima / lima / san juan de lurigancho / av. 13 de enero",
    "cruz de motupe",
    "lima / lima / san juan de lurigancho / cruz de motupe",
    "sjl- las flores",
    "lima / lima / san juan de lurigancho / sjl- las flores",
    "sjl-av.proceres",
    "lima / lima / san juan de lurigancho / sjl-av.proceres",
    "canto grande",
    "lima / lima / san juan de lurigancho / canto grande",
    "los pinos",
    "lima / lima / san juan de lurigancho / los pinos",
    "bayovar",
    "lima / lima / san juan de lurigancho / bayovar",
    "campoy",
    "lima / lima / san juan de lurigancho / campoy",
    "av. del mercado",
    "lima / lima / san juan de lurigancho / av. del mercado",
    "jr chinchaysuyo cdra 4",
    "lima / lima / san juan de lurigancho / jr chinchaysuyo cdra 4",
    "av central sjl",
    "lima / lima / san juan de lurigancho / av central sjl",
    "av. santa rosa cruce av. el sol",
    "lima / lima / san juan de lurigancho / av. santa rosa cruce av. el sol",
    "av malecon checa cdra. 1",
    "lima / lima / san juan de lurigancho / av malecon checa cdra. 1",
    "av circunvalacion sjl",
    "lima / lima / san juan de lurigancho / av circunvalacion sjl",
    "atocongo",
    "lima / lima / san juan de miraflores / atocongo",
    "maria auxiliadora",
    "lima / lima / san juan de miraflores / maria auxiliadora",
    "av. canevaro",
    "lima / lima / san juan de miraflores / av. canevaro",
    "av miguel grau pamplona alta",
    "lima / lima / san juan de miraflores / av miguel grau pamplona alta",
    "av san juan pamplona alta",
    "lima / lima / san juan de miraflores / av san juan pamplona alta",
    "av los precursores / las americas",
    "lima / lima / san juan de miraflores / av los precursores / las americas",
    "fiori",
    "lima / lima / san martin de porres / fiori",
    "av. canta callao con alisos",
    "lima / lima / san martin de porres / av. canta callao con alisos",
    "av bertello smp",
    "lima / lima / san martin de porres / av bertello smp",
    "smp-av. proceres",
    "lima / lima / san martin de porres / smp-av. proceres",
    "av. peru 15",
    "lima / lima / san martin de porres / av. peru 15",
    "av. lima cdra 38",
    "lima / lima / san martin de porres / av. lima cdra 38",
    "av. carlos izaguirre cuadra 23",
    "lima / lima / san martin de porres / av. carlos izaguirre cuadra 23",
    "av. gerardo unger cdra 64",
    "lima / lima / san martin de porres / av. gerardo unger cdra 64",
    "germán aguirre",
    "lima / lima / san martin de porres / germán aguirre",
    "av jose granda cdra 38",
    "lima / lima / san martin de porres / av jose granda cdra 38",
    "av. dominicos cdra 14",
    "lima / lima / san martin de porres / av. dominicos cdra 14",
    "av jose granda cdra. 25",
    "lima / lima / san martin de porres / av jose granda cdra. 25",
    "av. canta callao con izaguirre",
    "lima / lima / san martin de porres / av. canta callao con izaguirre",
    "av. universitaria cdra. 16",
    "lima / lima / san martin de porres / av. universitaria cdra. 16",
    "av central smp",
    "lima / lima / san martin de porres / av central smp",
    "av. huarochirí",
    "lima / lima / santa anita / av. huarochirí",
    "av santa rosa - sta anita",
    "lima / lima / santa anita / av santa rosa - sta anita",
    "jr cesar vallejo",
    "lima / lima / santa anita / jr cesar vallejo",
    "santa rosa",
    "lima / lima / santa rosa / santa rosa",
    "higuereta",
    "lima / lima / santiago de surco / higuereta",
    "surco mateo pumacahua",
    "lima / lima / santiago de surco / surco mateo pumacahua",
    "av tomas marsano - la bolichera",
    "lima / lima / santiago de surco / av tomas marsano - la bolichera",
    "rep. de panama",
    "lima / lima / surquillo / rep. de panama",
    "av. principal",
    "lima / lima / surquillo / av. principal",
    "av. cesar vallejo",
    "lima / lima / villa el salvador / av. cesar vallejo",
    "av. pastor sevilla",
    "lima / lima / villa el salvador / av. pastor sevilla",
    "óvalo mariátegui",
    "lima / lima / villa el salvador / óvalo mariátegui",
    "01 de mayo",
    "lima / lima / villa el salvador / 01 de mayo",
    "prueba sistemas qa",
    "lima / lima / villa el salvador / prueba sistemas qa",
    "las conchitas",
    "lima / lima / villa maria del triunfo / las conchitas",
    "pesquero",
    "lima / lima / villa maria del triunfo / pesquero",
    "av. lima - vmt",
    "lima / lima / villa maria del triunfo / av. lima - vmt",
    "av. villa maria",
    "lima / lima / villa maria del triunfo / av. villa maria",
    "nueva esperanza vmt",
    "lima / lima / villa maria del triunfo / nueva esperanza vmt",
    "barranca",
    "lima / barranca / barranca / barranca",
    "paramonga",
    "lima / barranca / paramonga / paramonga",
    "supe",
    "lima / barranca / supe / supe",
    "cañete san vicente",
    "lima / cañete / san vicente de canet / cañete san vicente",
    "ant panam sur cdra 11",
    "lima / cañete / chilca / ant panam sur cdra 11",
    "cañete imperial",
    "lima / cañete / imperial / cañete imperial",
    "mala",
    "lima / cañete / mala / mala",
    "nuevo imperial co",
    "lima / cañete / nuevo imperial / nuevo imperial co",
    "huaral",
    "lima / huaral / huaral / huaral",
    "chancay",
    "lima / huaral / chancay / chancay",
    "jicamarca",
    "lima / huarochiri / san antonio / jicamarca",
    "salaverry huacho co",
    "lima / huaura / huacho / salaverry huacho co",
    "huacho av indacochea",
    "lima / huaura / huacho / huacho av indacochea",
    "huaura",
    "lima / huaura / huaura / huaura",
    "sayan",
    "lima / huaura / sayan / sayan",
    "iquitos jr francisco bolognesi",
    "loreto / maynas / iquitos / iquitos jr francisco bolognesi",
    "iquitos co jr. pablo rossell",
    "loreto / maynas / iquitos / iquitos co jr. pablo rossell",
    "iquitos av tupac amaru",
    "loreto / maynas / iquitos / iquitos av tupac amaru",
    "punchana",
    "loreto / maynas / punchana / punchana",
    "av participacion parcela",
    "loreto / maynas / iquitos san juan bautista / av participacion parcela",
    "av jose a. quiñones",
    "loreto / maynas / iquitos san juan bautista / av jose a. quiñones",
    "ctra iquitos nauta",
    "loreto / maynas / iquitos san juan bautista / ctra iquitos nauta",
    "yurimaguas",
    "loreto / alto amazonas / yurimaguas / yurimaguas",
    "tambopata av la joya co",
    "madre de dios / tambopata / tambopata / tambopata av la joya co",
    "av 15 de agosto",
    "madre de dios / tambopata / tambopata / av 15 de agosto",
    "tambopata av circunvalacion",
    "madre de dios / tambopata / tambopata / tambopata av circunvalacion",
    "mazuko",
    "madre de dios / tambopata / inambari / mazuko",
    "el triunfo",
    "madre de dios / tambopata / las piedras / el triunfo",
    "iberia",
    "madre de dios / tahuamanu / iberia / iberia",
    "san antonio",
    "moquegua / mariscal nieto / moquegua / san antonio",
    "calle lima",
    "moquegua / mariscal nieto / moquegua / calle lima",
    "quebrada las lechuzas co",
    "moquegua / mariscal nieto / moquegua / quebrada las lechuzas co",
    "chen chen",
    "moquegua / mariscal nieto / moquegua / chen chen",
    "ilo co pampa inalambrica",
    "moquegua / ilo / ilo / ilo co pampa inalambrica",
    "ilo puerto",
    "moquegua / ilo / ilo / ilo puerto",
    "ilo pacocha",
    "moquegua / ilo / pacocha / ilo pacocha",
    "cerro de pasco",
    "pasco / pasco / chaupimarca / cerro de pasco",
    "huayllay",
    "pasco / pasco / huayllay / huayllay",
    "oxapampa",
    "pasco / oxapampa / oxapampa / oxapampa",
    "villa rica",
    "pasco / oxapampa / villa rica / villa rica",
    "av. luis eguiguren",
    "piura / piura / piura / av. luis eguiguren",
    "av. grau",
    "piura / piura / piura / av. grau",
    "av raul mata la cruz- dos grifos",
    "piura / piura / piura / av raul mata la cruz- dos grifos",
    "av tacna",
    "piura / piura / castilla / av tacna",
    "tacala",
    "piura / piura / castilla / tacala",
    "catacaos",
    "piura / piura / catacaos / catacaos",
    "la union",
    "piura / piura / la union / la union",
    "las lomas",
    "piura / piura / las lomas / las lomas",
    "tambo grande",
    "piura / piura / tambo grande / tambo grande",
    "calle emaús",
    "piura / piura / 26 de octubre / calle emaús",
    "parque industrial co piura futura",
    "piura / piura / 26 de octubre / parque industrial co piura futura",
    "av. gullman",
    "piura / piura / 26 de octubre / av. gullman",
    "aahh santa rosa piura",
    "piura / piura / 26 de octubre / aahh santa rosa piura",
    "ayabaca",
    "piura / ayabaca / ayabaca / ayabaca",
    "paimas",
    "piura / ayabaca / paimas / paimas",
    "huancabamba",
    "piura / huancabamba / huancabamba / huancabamba",
    "chulucanas",
    "piura / morropon / chulucanas / chulucanas",
    "morropon",
    "piura / morropon / morropon / morropon",
    "paita",
    "piura / paita / paita / paita",
    "sullana santa rosa",
    "piura / sullana / sullana / sullana santa rosa",
    "sullana co zona industrial",
    "piura / sullana / sullana / sullana co zona industrial",
    "bellavista sullana",
    "piura / sullana / bellavista / bellavista sullana",
    "ignacio escudero",
    "piura / sullana / ignacio escudero / ignacio escudero",
    "talara co asoc california",
    "piura / talara / parinas / talara co asoc california",
    "talara alta 9 de octubre",
    "piura / talara / parinas / talara alta 9 de octubre",
    "talara baja parque 22",
    "piura / talara / parinas / talara baja parque 22",
    "el alto",
    "piura / talara / el alto / el alto",
    "los organos",
    "piura / talara / los organos / los organos",
    "máncora",
    "piura / talara / mancora / máncora",
    "sechura",
    "piura / sechura / sechura / sechura",
    "av costanera",
    "puno / puno / puno / av costanera",
    "salcedo",
    "puno / puno / puno / salcedo",
    "alto puno",
    "puno / puno / puno / alto puno",
    "av 4 de noviembre co",
    "puno / puno / puno / av 4 de noviembre co",
    "azangaro",
    "puno / azangaro / azangaro / azangaro",
    "desaguadero",
    "puno / chucuito / desaguadero / desaguadero",
    "ilave",
    "puno / el collao / ilave / ilave",
    "ayaviri",
    "puno / melgar / ayaviri / ayaviri",
    "jr. mama ocllo",
    "puno / san roman / juliaca / jr. mama ocllo",
    "av. huancane cdra. 9",
    "puno / san roman / juliaca / av. huancane cdra. 9",
    "las mercedes",
    "puno / san roman / juliaca / las mercedes",
    "av. lampa",
    "puno / san roman / juliaca / av. lampa",
    "av. modesto borda",
    "puno / san roman / juliaca / av. modesto borda",
    "av independencia",
    "puno / san roman / juliaca / av independencia",
    "jr agustin gamarra",
    "puno / san roman / juliaca / jr agustin gamarra",
    "av heroes del pacifico co",
    "puno / san roman / juliaca / av heroes del pacifico co",
    "ovalo orquideas co",
    "san martin / moyobamba / moyobamba / ovalo orquideas co",
    "moyobamba centro",
    "san martin / moyobamba / moyobamba / moyobamba centro",
    "soritor",
    "san martin / moyobamba / soritor / soritor",
    "san martin bellavista",
    "san martin / bellavista / bellavista / san martin bellavista",
    "san jose de sisa",
    "san martin / el dorado / san jose de sisa / san jose de sisa",
    "saposoa",
    "san martin / huallaga / saposoa / saposoa",
    "lamas",
    "san martin / lamas / lamas / lamas",
    "juanjuí fernando belaunde terry co",
    "san martin / mariscal caceres / juanjui / juanjuí fernando belaunde terry co",
    "juanjui centro",
    "san martin / mariscal caceres / juanjui / juanjui centro",
    "picota",
    "san martin / picota / picota / picota",
    "rioja",
    "san martin / rioja / rioja / rioja",
    "segunda jerusalen",
    "san martin / rioja / elias soplin vargas / segunda jerusalen",
    "nueva cajamarca",
    "san martin / rioja / nueva cajamarca / nueva cajamarca",
    "pardo miguel naranjos",
    "san martin / rioja / pardo miguel / pardo miguel naranjos",
    "tarapoto co jr alfonso ugarte",
    "san martin / san martin / tarapoto / tarapoto co jr alfonso ugarte",
    "jr leoncio prado",
    "san martin / san martin / tarapoto / jr leoncio prado",
    "jr. tahuantinsuyo",
    "san martin / san martin / tarapoto / jr. tahuantinsuyo",
    "jr. ramón castilla",
    "san martin / san martin / tarapoto / jr. ramón castilla",
    "tarapoto la banda de shilcayo",
    "san martin / san martin / la banda de shilcayo / tarapoto la banda de shilcayo",
    "tarapoto jr. sargento lorez",
    "san martin / san martin / morales / tarapoto jr. sargento lorez",
    "av fernando belaunde",
    "san martin / tocache / tocache / av fernando belaunde",
    "jr fredy aliaga co",
    "san martin / tocache / tocache / jr fredy aliaga co",
    "uchiza",
    "san martin / tocache / uchiza / uchiza",
    "tacna co av. jorge basadre",
    "tacna / tacna / tacna / tacna co av. jorge basadre",
    "av vigil",
    "tacna / tacna / tacna / av vigil",
    "av. arias araguez",
    "tacna / tacna / tacna / av. arias araguez",
    "av ejercito",
    "tacna / tacna / tacna / av ejercito",
    "pocollay",
    "tacna / tacna / tacna / pocollay",
    "tacna ciudad nueva",
    "tacna / tacna / ciudad nueva / tacna ciudad nueva",
    "villa san francisco",
    "tacna / tacna / coronel gregorio albarracin lanchipa / villa san francisco",
    "av. municipal",
    "tacna / tacna / coronel gregorio albarracin lanchipa / av. municipal",
    "viñanis",
    "tacna / tacna / coronel gregorio albarracin lanchipa / viñanis",
    "tumbes - av arica",
    "tumbes / tumbes / tumbes / tumbes - av arica",
    "tumbes puyango",
    "tumbes / tumbes / tumbes / tumbes puyango",
    "tumbes co - panamericana norte km 2360",
    "tumbes / tumbes / tumbes / tumbes co - panamericana norte km 2360",
    "pampa grande tumbes",
    "tumbes / tumbes / tumbes / pampa grande tumbes",
    "corrales",
    "tumbes / tumbes / corrales / corrales",
    "la cruz tumbes",
    "tumbes / tumbes / la cruz / la cruz tumbes",
    "zorritos",
    "tumbes / contralmirante villa / zorritos / zorritos",
    "zarumilla",
    "tumbes / zarumilla / zarumilla / zarumilla",
    "aguas verdes",
    "tumbes / zarumilla / aguas verdes / aguas verdes",
    "calleria jr jose galvez",
    "ucayali / coronel portillo / pucallpa calleria / calleria jr jose galvez",
    "calleria av saenz peña",
    "ucayali / coronel portillo / pucallpa calleria / calleria av saenz peña",
    "pucallpa co federico basadre",
    "ucayali / coronel portillo / pucallpa yarinacocha / pucallpa co federico basadre",
    "yarinacocha centro",
    "ucayali / coronel portillo / pucallpa yarinacocha / yarinacocha centro",
    "yarinacocha av universitaria",
    "ucayali / coronel portillo / pucallpa yarinacocha / yarinacocha av universitaria",
    "manantay av aguaytia",
    "ucayali / coronel portillo / pucallpa manantay / manantay av aguaytia",
    "manantay av tupac amaru",
    "ucayali / coronel portillo / pucallpa manantay / manantay av tupac amaru",
    "aguaytía",
    "ucayali / padre abad / aguaytia / aguaytía"
];

// =============================================
// LOGICA DEL BUSCADOR DE AGENCIAS
// =============================================

buscadorInput.addEventListener('input', function() {
    const termino = this.value.toLowerCase().trim();
    
    if (termino.length === 0) {
        listaResultados.style.display = 'none';
        return;
    }

    const resultados = agenciasShalom.filter(agencia => 
        agencia.toLowerCase().includes(termino)
    );

    mostrarResultados(resultados);
});

function mostrarResultados(resultados) {
    listaResultados.innerHTML = '';
    
    if (resultados.length === 0) {
        listaResultados.style.display = 'none';
        return;
    }

    resultados.forEach(agencia => {
        const item = document.createElement('div');
        item.textContent = agencia;
        item.style.padding = '10px 15px';
        item.style.cursor = 'pointer';
        item.style.borderBottom = '1px solid #f0f0f0';
        item.style.fontSize = '14px';
        item.style.color = '#1a1a1a';
        
        item.onmouseover = function() {
            this.style.background = '#f9f9f9';
        };
        item.onmouseout = function() {
            this.style.background = 'white';
        };
        
        item.onclick = function() {
            const textoSeleccionado = this.textContent;
            buscadorInput.value = textoSeleccionado;
            agenciaInput.value = textoSeleccionado;
            listaResultados.style.display = 'none';
        };

        listaResultados.appendChild(item);
    });

    listaResultados.style.display = 'block';
}

document.addEventListener('click', function(e) {
    if (!buscadorInput.contains(e.target) && !listaResultados.contains(e.target)) {
        listaResultados.style.display = 'none';
    }
});

buscadorInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
        const primerResultado = listaResultados.querySelector('div');
        if (primerResultado) {
            primerResultado.click();
        }
    }
});

// =============================================
// MOSTRAR TICKET
// =============================================

function mostrarTicket(datos) {
    datosActuales = datos;
    console.log('📋 Mostrando ticket ID:', datos.id);
    
    tNombre.textContent = datos.nombre || 'No especificado';
    tDni.textContent = datos.dni || 'No especificado';
    tCelular.textContent = datos.celular || 'No especificado';
    tAgencia.textContent = datos.agencia || 'No especificado';
    tPedido.textContent = datos.pedido || 'Sin pedido';
    
    const fecha = datos.fecha ? new Date(datos.fecha) : new Date();
    tFechaHora.textContent = fecha.toLocaleDateString('es-PE') + ' ' + fecha.toLocaleTimeString('es-PE');

    document.getElementById('formularioContainer').style.display = 'none';
    ticket.classList.remove('oculto');
    ticket.classList.add('visible');
    btnImprimirTicket.style.display = 'block';
    
    configurarAutoSave();
    
    setTimeout(() => {
        ticket.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 300);
}

// =============================================
// CONFIGURAR GUARDADO AUTOMÁTICO
// =============================================

function configurarAutoSave() {
    const camposEditables = [tNombre, tDni, tCelular, tAgencia, tPedido];
    
    camposEditables.forEach(campo => {
        campo.addEventListener('blur', function() {
            guardarCambiosAutomatico();
        });
        
        campo.addEventListener('input', function() {
            clearTimeout(timeoutGuardado);
            timeoutGuardado = setTimeout(() => {
                guardarCambiosAutomatico();
            }, 500);
        });
    });
}

// =============================================
// ENVIAR FORMULARIO
// =============================================

formulario.addEventListener('submit', function(e) {
    e.preventDefault();

    const nombre = nombreInput.value.trim();
    const dni = dniInput.value.trim();
    const celular = celularInput.value.trim();
    const agencia = agenciaInput.value.trim();
    const pedido = pedidoInput.value.trim();
    
    // Obtener método de envío seleccionado
    const metodoEnvio = document.querySelector('input[name="metodoEnvio"]:checked');
    const metodo = metodoEnvio ? metodoEnvio.value : 'Terrestre';

    if (!nombre) { alert('Ingrese su Nombre Completo'); nombreInput.focus(); return; }
    if (!dni) { alert('Ingrese su DNI / CE'); dniInput.focus(); return; }
    if (!celular) { alert('Ingrese su numero de Celular'); celularInput.focus(); return; }
    if (!agencia) { alert('Seleccione una Agencia Shalom'); buscadorInput.focus(); return; }
    if (!pedido) { alert('Ingrese el detalle del PEDIDO'); pedidoInput.focus(); return; }
    if (celular.length < 9) { alert('El celular debe tener 9 digitos'); celularInput.focus(); return; }

    const id = Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 5).toUpperCase();

    const datos = {
        id: id,
        nombre: nombre,
        dni: dni,
        celular: celular,
        agencia: agencia + ' (' + metodo + ')',
        pedido: pedido,
        fecha: new Date().toISOString()
    };

    guardarLocal(datos);

    const datosEncoded = codificarDatos(datos);
    const urlTicket = window.location.origin + window.location.pathname + '?data=' + datosEncoded;

    const mensajeWhatsApp = construirMensajeWhatsApp(datos, urlTicket);
    abrirWhatsApp(mensajeWhatsApp);

    mostrarTicket(datos);
});

// =============================================
// CONSTRUIR MENSAJE WHATSAPP
// =============================================

function construirMensajeWhatsApp(datos, urlTicket) {
    let mensaje = '--- DATOS DE ENVIO ---%0A%0A';
    
    mensaje += 'Nombre:%0A';
    mensaje += datos.nombre + '%0A%0A';
    
    mensaje += 'DNI / CE:%0A';
    mensaje += datos.dni + '%0A%0A';
    
    mensaje += 'Celular:%0A';
    mensaje += datos.celular + '%0A%0A';
    
    mensaje += 'Direccion Agencia:%0A';
    mensaje += datos.agencia + '%0A%0A';
    
    mensaje += 'PEDIDO:%0A';
    mensaje += datos.pedido + '%0A%0A';
    
    mensaje += '---------------------%0A';
    mensaje += 'Link datos envio:%0A';
    mensaje += urlTicket;
    
    return mensaje;
}

// =============================================
// ABRIR WHATSAPP
// =============================================

function abrirWhatsApp(mensaje) {
    const numeroCompleto = '51' + CONFIG.whatsapp;
    const url = 'https://wa.me/' + numeroCompleto + '?text=' + mensaje;
    window.open(url, '_blank');
}

// =============================================
// IMPRIMIR TICKET
// =============================================

btnImprimirTicket.addEventListener('click', function() {
    guardarCambiosAutomatico();
    setTimeout(() => {
        window.print();
    }, 200);
});

// =============================================
// FORMATOS DE CAMPOS
// =============================================

celularInput.addEventListener('input', function() {
    this.value = this.value.replace(/\D/g, '');
    if (this.value.length > 9) this.value = this.value.slice(0, 9);
});

dniInput.addEventListener('input', function() {
    this.value = this.value.replace(/[^a-zA-Z0-9]/g, '');
    if (this.value.length > 15) this.value = this.value.slice(0, 15);
});

nombreInput.addEventListener('blur', function() {
    this.value = this.value.toLowerCase().split(' ')
        .map(p => p.charAt(0).toUpperCase() + p.slice(1))
        .join(' ');
});

// =============================================
// CARGAR DATOS DESDE URL
// =============================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Cargando pagina... ' + new Date().toISOString());
    
    const params = new URLSearchParams(window.location.search);
    const dataEncoded = params.get('data');
    
    if (dataEncoded) {
        const datos = decodificarDatos(dataEncoded);
        if (datos) {
            console.log('✅ Datos cargados ID:', datos.id);
            mostrarTicket(datos);
        } else {
            alert('Error al cargar los datos del link');
        }
    }
    
    const logoImg = document.getElementById('logoImg');
    if (logoImg) {
        logoImg.onerror = function() {
            this.style.display = 'none';
            const fallback = document.createElement('h2');
            fallback.textContent = 'MULTITOOLS';
            fallback.style.color = '#f9c80e';
            fallback.style.fontSize = '32px';
            fallback.style.fontWeight = '900';
            fallback.style.textAlign = 'center';
            this.parentNode.appendChild(fallback);
        };
    }
    
    if (window.location.search.includes('_clean=true') || window.location.search.includes('_t=')) {
        const dataParam = new URLSearchParams(window.location.search).get('data');
        const newUrl = window.location.origin + window.location.pathname + 
                       (dataParam ? '?data=' + dataParam : '');
        if (newUrl !== window.location.href) {
            window.history.replaceState({}, '', newUrl);
        }
    }
    
    console.log('✅ Sistema v8.0 listo con buscador de agencias');
});
