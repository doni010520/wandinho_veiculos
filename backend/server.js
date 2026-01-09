// Deletar veículo
app.delete('/api/veiculos/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // 🔧 PRIMEIRO: Buscar o veículo para pegar o google_drive_folder_id
    const { data: veiculo, error: fetchError } = await supabase
      .from('veiculos')
      .select('google_drive_folder_id')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    // Deletar veículo do Supabase (CASCADE deleta as fotos automaticamente)
    const { error: deleteError } = await supabase
      .from('veiculos')
      .delete()
      .eq('id', id);

    if (deleteError) throw deleteError;

    // 🔧 DEPOIS: Deletar pasta do Google Drive
    if (veiculo?.google_drive_folder_id) {
      try {
        await googleDrive.deleteVehicleFolder(veiculo.google_drive_folder_id);
      } catch (driveError) {
        console.error('Erro ao deletar pasta do Drive:', driveError);
        // Não falha a operação se não conseguir deletar do Drive
      }
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Erro ao deletar veículo:', error);
    res.status(500).json({ error: error.message });
  }
});
