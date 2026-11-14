const ROLE_TITLES = {
  parent: 'Ebeveyn',
  specialist: 'Uzman',
  child: 'Çocuk',
}

function RoleScreen({ user }) {
  const title = ROLE_TITLES[user.role] ?? user.role

  return (
    <main className="app">
      <h1>Synergy</h1>
      <h2>{`${title} ekranı`}</h2>
      <p>Hoş geldin, {user.name}.</p>
      <p>Bu ekranın içeriği sonraki modüllerle eklenecek.</p>
    </main>
  )
}

export default RoleScreen