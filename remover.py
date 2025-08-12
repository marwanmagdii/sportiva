import tkinter as tk
from tkinter import filedialog, messagebox, ttk
import subprocess
import sys
import os
import threading
import torch
import torchaudio
from demucs.separate import main as demucs_main

class VocalRemoverApp:
    """
    A GUI application for removing vocals from audio files and
    removing specific sections of the vocal track.
    """
    def __init__(self, master):
        self.master = master
        master.title("Python Vocal Remover")
        master.geometry("600x450")
        master.configure(bg='#2c3e50')

        # Style configuration
        style = ttk.Style()
        style.theme_use('clam')
        style.configure("TButton", padding=6, relief="flat", background="#3498db", foreground="white", font=('Helvetica', 10, 'bold'))
        style.map("TButton", background=[('active', '#2980b9')])
        style.configure("TLabel", background="#2c3e50", foreground="white", font=('Helvetica', 10))
        style.configure("TFrame", background="#2c3e50")
        style.configure("TProgressbar", thickness=20, background='#3498db', troughcolor='#34495e')

        self.file_path = ""
        self.output_dir = "separated_audio"
        os.makedirs(self.output_dir, exist_ok=True)

        # --- UI Elements ---
        main_frame = ttk.Frame(master, padding="20")
        main_frame.pack(expand=True, fill=tk.BOTH)

        # File Selection
        file_frame = ttk.Frame(main_frame)
        file_frame.pack(pady=10, fill=tk.X)
        self.load_button = ttk.Button(file_frame, text="Load Audio File", command=self.load_file)
        self.load_button.pack(side=tk.LEFT, expand=True, fill=tk.X, padx=(0, 10))
        self.file_label = ttk.Label(file_frame, text="No file selected", wraplength=400)
        self.file_label.pack(side=tk.LEFT)

        # Processing Controls
        process_frame = ttk.Frame(main_frame)
        process_frame.pack(pady=20, fill=tk.X)
        self.separate_button = ttk.Button(process_frame, text="Separate Vocals & Instrumentals", command=self.start_separation_thread)
        self.separate_button.pack(expand=True, fill=tk.X)

        # Section Removal
        removal_frame = ttk.LabelFrame(main_frame, text="Remove Vocal Section (Optional)", padding="10")
        removal_frame.pack(pady=10, fill=tk.X)
        
        ttk.Label(removal_frame, text="Start Time (s):").grid(row=0, column=0, padx=5, pady=5, sticky="w")
        self.start_time_entry = ttk.Entry(removal_frame, width=10)
        self.start_time_entry.grid(row=0, column=1, padx=5, pady=5)
        self.start_time_entry.insert(0, "0")

        ttk.Label(removal_frame, text="End Time (s):").grid(row=0, column=2, padx=5, pady=5, sticky="w")
        self.end_time_entry = ttk.Entry(removal_frame, width=10)
        self.end_time_entry.grid(row=0, column=3, padx=5, pady=5)
        self.end_time_entry.insert(0, "10")

        self.remove_section_button = ttk.Button(removal_frame, text="Remove Section and Recombine", command=self.remove_section_and_recombine)
        self.remove_section_button.grid(row=1, column=0, columnspan=4, pady=10, sticky="ew")
        self.remove_section_button.config(state=tk.DISABLED)

        # Progress Bar & Status
        status_frame = ttk.Frame(main_frame)
        status_frame.pack(pady=10, fill=tk.X, side=tk.BOTTOM)
        self.progress = ttk.Progressbar(status_frame, orient=tk.HORIZONTAL, length=100, mode='determinate')
        self.progress.pack(fill=tk.X, pady=(5,0))
        self.status_label = ttk.Label(status_frame, text="Status: Ready")
        self.status_label.pack(fill=tk.X, pady=(5,0))


    def load_file(self):
        """Opens a file dialog to select an audio file."""
        self.file_path = filedialog.askopenfilename(
            filetypes=[("Audio Files", "*.mp3 *.wav *.flac")]
        )
        if self.file_path:
            self.file_label.config(text=os.path.basename(self.file_path))
            self.status_label.config(text="Status: File loaded")
            self.remove_section_button.config(state=tk.DISABLED)
        else:
            self.file_label.config(text="No file selected")

    def start_separation_thread(self):
        """Starts the audio separation in a separate thread to keep the GUI responsive."""
        if not self.file_path:
            messagebox.showerror("Error", "Please load an audio file first.")
            return

        self.separate_button.config(state=tk.DISABLED)
        self.status_label.config(text="Status: Separating audio... This may take a while.")
        self.progress['value'] = 0
        self.master.update_idletasks()

        # Run demucs in a separate thread
        thread = threading.Thread(target=self.run_demucs)
        thread.start()

    def run_demucs(self):
        """Executes the demucs separation command."""
        try:
            # Demucs command-line arguments as a list
            # We use the default 'htdemucs' model.
            # The '-o' flag sets the output directory.
            # The '--two-stems' flag can be used to just get vocals/no_vocals
            args = ["-o", self.output_dir, "--", self.file_path]
            
            # Use a custom progress hook if possible, for now simulate progress
            # In a real app, you might parse stdout or use a library with callbacks
            self.progress.start(10) # Indeterminate progress
            
            # Calling demucs's main function directly
            sys.argv = [sys.argv[0]] + args
            demucs_main()

            self.progress.stop()
            self.progress['value'] = 100
            self.status_label.config(text="Status: Separation complete!")
            messagebox.showinfo("Success", f"Audio separated! Files are in '{self.output_dir}' directory.")
            self.remove_section_button.config(state=tk.NORMAL)

        except Exception as e:
            self.status_label.config(text="Status: Error during separation.")
            messagebox.showerror("Separation Error", f"An error occurred: {e}")
        finally:
            self.separate_button.config(state=tk.NORMAL)
            self.progress['value'] = 0

    def get_separated_files(self):
        """Finds the paths of the separated audio files."""
        base_name = os.path.splitext(os.path.basename(self.file_path))[0]
        # Path inside the 'htdemucs' subfolder created by demucs
        model_output_dir = os.path.join(self.output_dir, 'htdemucs', base_name)

        if not os.path.exists(model_output_dir):
            return None

        files = {
            'vocals': os.path.join(model_output_dir, 'vocals.wav'),
            'bass': os.path.join(model_output_dir, 'bass.wav'),
            'drums': os.path.join(model_output_dir, 'drums.wav'),
            'other': os.path.join(model_output_dir, 'other.wav'),
        }
        
        # Check if all expected files exist
        for f in files.values():
            if not os.path.exists(f):
                messagebox.showerror("Error", f"Could not find separated file: {f}")
                return None
        return files

    def remove_section_and_recombine(self):
        """Loads the vocal track, silences a section, and saves the new mix."""
        separated_files = self.get_separated_files()
        if not separated_files:
            messagebox.showerror("Error", "Separated files not found. Please run separation first.")
            return

        try:
            start_time = float(self.start_time_entry.get())
            end_time = float(self.end_time_entry.get())
            if start_time >= end_time:
                messagebox.showerror("Input Error", "Start time must be less than end time.")
                return

            self.status_label.config(text="Status: Modifying vocal track...")

            # Load the vocal track
            vocals_waveform, sample_rate = torchaudio.load(separated_files['vocals'])

            # Convert time to sample indices
            start_sample = int(start_time * sample_rate)
            end_sample = int(end_time * sample_rate)

            # Ensure indices are within bounds
            if start_sample >= vocals_waveform.shape[1] or end_sample < 0:
                 messagebox.showinfo("Info", "Time range is outside the song's duration. No changes made.")
            else:
                start_sample = max(0, start_sample)
                end_sample = min(vocals_waveform.shape[1], end_sample)
                # Silence the specified section (set samples to 0)
                vocals_waveform[:, start_sample:end_sample] = 0.0

            self.status_label.config(text="Status: Recombining tracks...")

            # Load other tracks
            bass_waveform, _ = torchaudio.load(separated_files['bass'])
            drums_waveform, _ = torchaudio.load(separated_files['drums'])
            other_waveform, _ = torchaudio.load(separated_files['other'])

            # Combine the instrumental tracks with the modified vocal track
            # Ensure all tensors have the same length by padding or truncating
            max_len = max(vocals_waveform.shape[1], bass_waveform.shape[1], drums_waveform.shape[1], other_waveform.shape[1])
            
            vocals_waveform = self.pad_tensor(vocals_waveform, max_len)
            bass_waveform = self.pad_tensor(bass_waveform, max_len)
            drums_waveform = self.pad_tensor(drums_waveform, max_len)
            other_waveform = self.pad_tensor(other_waveform, max_len)

            final_mix = vocals_waveform + bass_waveform + drums_waveform + other_waveform
            
            # Ask for save location
            save_path = filedialog.asksaveasfilename(
                defaultextension=".wav",
                filetypes=[("WAV files", "*.wav")],
                title="Save Modified Audio",
                initialfile=f"{os.path.splitext(os.path.basename(self.file_path))[0]}_modified.wav"
            )

            if save_path:
                torchaudio.save(save_path, final_mix, sample_rate)
                self.status_label.config(text="Status: Modified file saved!")
                messagebox.showinfo("Success", f"Saved modified audio to {save_path}")
            else:
                self.status_label.config(text="Status: Save cancelled.")

        except ValueError:
            messagebox.showerror("Input Error", "Please enter valid numbers for start and end times.")
        except Exception as e:
            messagebox.showerror("Error", f"An error occurred during processing: {e}")
            self.status_label.config(text="Status: Error.")

    def pad_tensor(self, tensor, length):
        """Pads or truncates a tensor to a specific length."""
        current_len = tensor.shape[1]
        if current_len < length:
            padding = length - current_len
            return torch.nn.functional.pad(tensor, (0, padding))
        elif current_len > length:
            return tensor[:, :length]
        return tensor


if __name__ == "__main__":
    # Before running, ensure you have the necessary libraries installed:
    # pip install tkinter torch torchaudio
    # pip install -U demucs
    
    # Check if demucs is installed
    try:
        import demucs
    except ImportError:
        print("Demucs not found. Please install it:")
        print("pip install -U demucs")
        sys.exit(1)

    root = tk.Tk()
    app = VocalRemoverApp(root)
    root.mainloop()
