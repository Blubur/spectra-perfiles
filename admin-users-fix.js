/*
  Correccion para el panel admin.

  Problema:
  Los usuarios seguian existiendo en Firestore, pero el admin esperaba que cada
  documento tuviera un campo interno `username`. Si los documentos antiguos usan
  el nombre de usuario como ID del documento, aparecian como vacios o no se
  podian editar correctamente.

  Como aplicarlo:
  En tu admin.html, dentro de loadAll(), sustituye el bloque de carga de users
  por este.
*/

const uSnap = await getDocs(collection(db, 'users'));
allUsers = {};
uSnap.forEach(d => {
  const data = d.data();
  allUsers[d.id] = {
    ...data,
    username: data.username || d.id
  };
});

/*
  Recomendado tambien:
  En renderUsers(), sustituye:

    const users = Object.values(allUsers);

  por:
*/

const users = Object.entries(allUsers).map(([id, data]) => ({
  ...data,
  username: data.username || id
}));
